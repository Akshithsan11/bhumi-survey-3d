"""Bhumi Survey 3D - FastAPI Backend Application"""

import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.database import get_db, engine, Base, SessionLocal
from app.models import User, Parcel, Building, Floor, PropertyUnit, ULPIN, Infrastructure, AIJob, ValidationResult
from app.routes.auth import router as auth_router
from app.routes.parcels import router as parcels_router
from app.routes.buildings import router as buildings_router
from app.routes.floors import router as floors_router
from app.routes.units import router as units_router
from app.routes.ulpin import router as ulpin_router
from app.routes.analysis import router as analysis_router
from app.routes.validation import router as validation_router
from app.routes.infrastructure import router as infra_router
from app.routes.stats import router as stats_router
from app.services.auth import get_password_hash


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    db = SessionLocal()
    try:
        admin_email = os.environ.get("ADMIN_EMAIL", "").strip()
        admin_password = os.environ.get("ADMIN_PASSWORD", "").strip()
        if admin_email and admin_password and len(admin_password) >= 8:
            admin = db.query(User).filter(User.email == admin_email).first()
            if not admin:
                admin = User(
                    username=os.environ.get("ADMIN_USERNAME", "admin"),
                    email=admin_email,
                    password_hash=get_password_hash(admin_password),
                )
                db.add(admin)
                db.commit()
    finally:
        db.close()
    yield


def _ensure_columns():
    """Add columns introduced after initial create_all (SQLite-safe)."""
    from sqlalchemy import inspect, text
    try:
        insp = inspect(engine)
        if "buildings" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("buildings")}
            if "area_sqm" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE buildings ADD COLUMN area_sqm VARCHAR(20)"))
    except Exception:
        pass


app = FastAPI(
    title="Bhumi Survey 3D API",
    description="3D Property Intelligence Platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "https://frontend-pied-nine-61.vercel.app,http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(parcels_router)
app.include_router(buildings_router)
app.include_router(floors_router)
app.include_router(units_router)
app.include_router(ulpin_router)
app.include_router(analysis_router)
app.include_router(validation_router)
app.include_router(infra_router)
app.include_router(stats_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Bhumi Survey 3D API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "active",
    }


@app.get("/health", tags=["health"], include_in_schema=False)
async def health():
    from sqlalchemy import text
    db_status = "connected"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception:
        db_status = "disconnected"
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _debug_allowed() -> bool:
    return os.environ.get("ENABLE_DEBUG", "false").lower() == "true"


@app.get("/debug/db", tags=["debug"], include_in_schema=False)
async def debug_db():
    if not _debug_allowed():
        raise HTTPException(status_code=404, detail="Not Found")
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            n = db.query(User).count()
            return {"ok": True, "users": n}
        finally:
            db.close()
    except Exception:
        return {"ok": False, "error": "database error"}


@app.get("/debug/bcrypt", tags=["debug"], include_in_schema=False)
async def debug_bcrypt():
    if not _debug_allowed():
        raise HTTPException(status_code=404, detail="Not Found")
    try:
        probe = os.environ.get("DEBUG_PROBE_VALUE", "probe-value")
        h = get_password_hash(probe)
        from app.services.auth import verify_password
        return {"ok": True, "verified": verify_password(probe, h)}
    except Exception:
        return {"ok": False, "error": "bcrypt error"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))