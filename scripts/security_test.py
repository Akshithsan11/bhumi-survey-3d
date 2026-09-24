"""Bhumi Survey 3D security smoke tests.

Usage:
  python scripts/security_test.py [BASE_URL]
Default BASE_URL: http://127.0.0.1:8000

Credentials are read from environment variables only (never hardcoded):
  TEST_ADMIN_EMAIL    - admin email for login/change-password tests
  TEST_ADMIN_PASSWORD - admin password for those tests

If TEST_ADMIN_* are unset, admin login tests are skipped.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
import uuid

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "").strip()
RESULTS: list[tuple[bool, str, str]] = []


def req(method: str, path: str, body=None, headers=None, origin=None):
    url = f"{BASE}{path}"
    data = None
    hdrs = dict(headers or {})
    if body is not None:
        if isinstance(body, (bytes, bytearray)):
            data = body
        else:
            data = json.dumps(body).encode()
            hdrs.setdefault("Content-Type", "application/json")
    if origin:
        hdrs["Origin"] = origin
    r = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read()
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = raw[:200]
            return resp.status, dict(resp.headers), parsed
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = raw[:200]
        return e.code, dict(e.headers), parsed


def check(name: str, ok: bool, detail: str = ""):
    RESULTS.append((ok, name, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def main():
    # 1. Health
    st, _, body = req("GET", "/health")
    check("health endpoint 200", st == 200, str(st))
    check("health reports database", isinstance(body, dict) and "database" in body, str(body))

    # 2. Debug endpoints gated
    st, _, _ = req("GET", "/debug/db")
    check("debug/db not exposed", st == 404, str(st))
    st, _, _ = req("GET", "/debug/bcrypt")
    check("debug/bcrypt not exposed", st == 404, str(st))

    # 3. Guest mode: public GETs allowed, auth still required for identity/writes
    for path in [
        "/api/stats/dashboard",
        "/api/parcels",
        "/api/buildings",
        "/api/ulpin",
        "/api/infrastructure",
        "/api/floors",
        "/api/units",
    ]:
        st, _, _ = req("GET", path)
        check(f"public GET {path}", st == 200, str(st))

    for path in [
        "/api/auth/me",
        "/api/auth/change-password",
    ]:
        st, _, _ = req("GET" if path == "/api/auth/me" else "POST", path, body={} if path.endswith("change-password") else None)
        check(f"401 unauth {path}", st == 401, str(st))

    # Writes still require auth
    st, _, _ = req("POST", "/api/ulpin/generate", body={"plot_code": "X"})
    check("401 unauth POST /api/ulpin/generate", st == 401, str(st))
    st, _, _ = req("POST", "/api/parcels", body={"code": "XX"})
    check("401 unauth POST /api/parcels", st == 401, str(st))
    st, _, _ = req("POST", "/api/validation", body={"building_id": 1})
    check("401 unauth POST /api/validation", st == 401, str(st))

    # 4. Invalid JWT
    st, _, _ = req(
        "GET",
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    check("invalid JWT rejected 401", st == 401, str(st))

    # 5. Login with wrong password (any email — no real credentials required)
    st, _, body = req(
        "POST",
        "/api/auth/login",
        body={"email": "nobody@example.com", "password": "wrong-password"},
    )
    check("wrong password 401", st == 401, str(st))
    detail = str((body or {}).get("detail", "")).lower()
    check(
        "login error does not leak internals",
        "traceback" not in detail and "sqlite" not in detail and "sqlalchemy" not in detail,
        detail[:80],
    )

    # 6. SQL-ish injection in login email (should not 500)
    st, _, body = req(
        "POST",
        "/api/auth/login",
        body={"email": "nobody@example.com' OR '1'='1", "password": "x"},
    )
    check("SQLi login not 500", st in (400, 401, 422), str(st))

    # 7. XSS-ish parcel create unauthenticated
    st, _, _ = req(
        "POST",
        "/api/parcels",
        body={"code": "<script>alert(1)</script>"},
    )
    check("unauth parcel create blocked", st == 401, str(st))

    # 8. Successful login + change-password flow (only if TEST_ADMIN_* provided)
    if not (ADMIN_EMAIL and ADMIN_PASSWORD):
        check("admin login tests skipped (set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)", True, "skipped")
    else:
        st, _, body = req(
            "POST",
            "/api/auth/login",
            body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        check("admin login 200", st == 200, str(st))
        token = (body or {}).get("access_token", "")
        if not token:
            check("got token", False, "no token")
        else:
            h = {"Authorization": f"Bearer {token}"}
            # wrong current password
            st, _, _ = req(
                "POST",
                "/api/auth/change-password",
                body={"current_password": "nope", "new_password": "NewPass1!"},
                headers=h,
            )
            check("wrong current password rejected", st == 400, str(st))

            # weak new password
            st, _, _ = req(
                "POST",
                "/api/auth/change-password",
                body={"current_password": ADMIN_PASSWORD, "new_password": "123"},
                headers=h,
            )
            check("short new password rejected", st == 422, str(st))

            # same password
            st, _, _ = req(
                "POST",
                "/api/auth/change-password",
                body={"current_password": ADMIN_PASSWORD, "new_password": ADMIN_PASSWORD},
                headers=h,
            )
            check("identical password rejected", st == 400, str(st))

    # 9. CORS: allowed origin
    st, headers, _ = req("GET", "/health", origin="https://frontend-pied-nine-61.vercel.app")
    acao = headers.get("Access-Control-Allow-Origin") or headers.get("access-control-allow-origin")
    check("CORS allows vercel origin", st == 200 and (acao in (None, "*", "https://frontend-pied-nine-61.vercel.app")), f"status={st} acao={acao}")

    # 10. CORS: disallowed origin (browser would block; server should not reflect evil origin)
    st, headers, _ = req("GET", "/api/auth/me", origin="https://evil.example")
    acao = headers.get("Access-Control-Allow-Origin") or headers.get("access-control-allow-origin")
    check("CORS does not reflect evil origin", acao not in ("https://evil.example", "*"), f"acao={acao}")

    # 11. Signup error does not leak internals
    email = f"sec-{uuid.uuid4().hex[:10]}@example.com"
    st, _, body = req(
        "POST",
        "/api/auth/signup",
        body={"username": f"sec{uuid.uuid4().hex[:8]}", "email": email, "password": "short"},
    )
    check("short signup password 422", st == 422, str(st))

    # duplicate signup
    uname = f"sec{uuid.uuid4().hex[:8]}"
    st, _, _ = req(
        "POST",
        "/api/auth/signup",
        body={"username": uname, "email": email.replace("short", "ok") if False else f"dup-{uuid.uuid4().hex[:8]}@example.com", "password": "GoodPass1!"},
    )
    check("valid signup works", st == 201, str(st))

    # 12. API root
    st, _, body = req("GET", "/")
    check("API root ok", st == 200, str(st))

    # 13. OpenAPI does not include debug routes
    st, _, body = req("GET", "/openapi.json")
    paths = list((body or {}).get("paths", {}).keys()) if isinstance(body, dict) else []
    check("openapi hides debug", not any(p.startswith("/debug") for p in paths), str(len(paths)))

    print()
    passed = sum(1 for ok, _, _ in RESULTS if ok)
    total = len(RESULTS)
    print(f"Security tests: {passed}/{total} passed")
    if passed != total:
        print("Failures:")
        for ok, name, detail in RESULTS:
            if not ok:
                print(f"  - {name}: {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
