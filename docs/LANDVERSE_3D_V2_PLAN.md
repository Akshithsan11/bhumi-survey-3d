# Bhumi Survey 3D v2 — Complete Plan & Ecosystem
*Copy this entire document into Google Docs. Two parts + flowchart + clarification questions.*

---

# PART 1 — What to Do / What Not to Do
*(Action plan — the to-do list)*

---

## ✅ DO

| Step | Action | Details |
|---|---|---|
| 1 | **Create a brand-new folder** | `C:\Users\AKSHITH\OneDrive\Desktop\Bhumi Survey 3D\` — fresh copy, nothing from the old repo |
| 2 | **Create a brand-new GitHub repository** | On github.com → New → `bhumi-survey-3d` (or whatever name you prefer). Do NOT push to the old repo |
| 3 | **Copy source code fresh** | Copy `backend/`, `frontend/`, `database/` from the old project into the new folder — but do NOT copy `.git/`, `node_modules/`, `__pycache__/`, or any build artifacts |
| 4 | **Delete old remote links** | The new folder must have no `.git` folder at first; initialize a new one from scratch |
| 5 | **Add .env files (.gitignored)** | Both frontend and backend get their own `.env` files — never committed to GitHub |
| 6 | **Add authentication system** | New login/signup pages on frontend, new auth routes + user model on backend, hashed passwords, JWT tokens |
| 7 | **Add CORS support** | Backend must explicitly allow requests from the Vercel domain (different origin = different problem than Railway) |
| 8 | **Switch hosting targets** | Frontend → Vercel. Backend + Postgres → Render |
| 9 | **Update all config files** | `Dockerfile`, `vercel.json`, `render.yaml`, `nginx.conf`, `config.ts`, `docker-compose.yml` |
| 10 | **Push to new repo → deploy** | Push to the new GitHub repo, connect both Vercel and Render to it |

---

## ❌ DO NOT

| Don't | Why |
|---|---|
| Do NOT reuse the old repo (`SIH_working_project_26011` or `landverse-3D`) | Ownership conflicts from other contributors — you'll get push/permission errors |
| Do NOT push `.env` files to GitHub | They contain passwords, database URLs, JWT secrets — always in `.gitignore` |
| Do NOT push `node_modules/`, `__pycache__/`, `uploads/`, `db.sqlite3` | Either generated or too large; always in `.gitignore` |
| Do NOT use Railway | Replaced by Vercel (frontend) + Render (backend) |
| Do NOT use the same-origin trick (`config.js` runtime injection) | Vercel and Render are on different domains → need proper CORS + absolute `VITE_API_URL` |
| Do NOT copy `.git` from the old project | It carries old remote URLs and commit history you don't want |
| Do NOT skip CORS configuration | Without it, the Vercel site will silently fail to talk to the Render API |
| Do NOT hardcode API URLs in source code | Always read from `.env` → `import.meta.env` |

---

## 🔄 New Folder Structure (planned)

```
Bhumi Survey 3D/
├── .gitignore              ← Updated (adds .env, uploads, __pycache__, .env.local)
├── README.md               ← Updated (new hosting info, setup instructions)
├── REPORT.md               ← Updated (new architecture)
├── docker-compose.yml      ← Updated (Render-ready, no Railway refs)
├── Dockerfile              ← Updated (multi-stage, Render-compatible)
├── backend/
│   ├── .env                ← Local dev secrets (NOT committed)
│   ├── .env.example        ← Safe to commit template
│   ├── .gitignore
│   ├── requirements.txt    ← Added: flask-cors, flask-jwt-extended, bcrypt (or fastapi equivalent)
│   ├── Dockerfile          ← Updated for Render
│   ├── render.yaml         ← NEW: Render service definition
│   ├── app/
│   │   ├── main.py         ← Added: CORS middleware, auth routes
│   │   ├── database.py     ← Updated: Render Postgres only
│   │   ├── models.py       ← Added: User model
│   │   ├── routes/
│   │   │   ├── auth.py     ← NEW: login, signup, logout, token refresh
│   │   │   └── ... (existing routes, updated with auth checks)
│   │   └── services/       ← Same (ai_detector, ulpin, validation)
│   └── seed.py             ← Added: admin user seed
├── frontend/
│   ├── .env.local          ← VITE_API_URL (NOT committed)
│   ├── .env.example        ← Safe to commit template
│   ├── .gitignore
│   ├── package.json        ← Added: auth libraries
│   ├── vercel.json         ← Updated: frameworkOrigin, rewrites to Render API
│   ├── Dockerfile          ← Updated for Vercel (or use Vercel's native build)
│   ├── nginx.conf          ← Updated: API proxy points to Render URL
│   ├── src/
│   │   ├── api/client.ts   ← Updated: adds Authorization header
│   │   ├── context/
│   │   │   └── AuthContext.tsx  ← NEW: auth state, token storage, protected routes
│   │   ├── pages/
│   │   │   ├── Login.tsx       ← NEW
│   │   │   ├── Signup.tsx      ← NEW
│   │   │   └── ... (existing pages, some wrapped in AuthGuard)
│   │   └── components/
│   │       └── AuthGuard.tsx ← NEW: redirect if not logged in
│   └── ... (rest unchanged)
├── database/               ← Same (schema.sql, seed_data.sql)
└── uploads/                ← Same (added to .gitignore)
```

---

## 📋 Execution Order

1. Create new folder + new GitHub repo (you do this on github.com)
2. Clone/copy code into new folder, remove `.git`
3. Initialize new git, commit, push
4. Add auth system (backend + frontend)
5. Add CORS + .env files
6. Update all config files for Vercel/Render
7. Push to new repo
8. Deploy backend to Render (create DB + service + env vars)
9. Deploy frontend to Vercel (connect repo + env vars)
10. Test end-to-end

---

---

# PART 2 — Formal Ecosystem After Changes
*(Technical specification — save as private Google Doc)*

---

## Project Name
**Bhumi Survey 3D v2** — Full-stack 3D Property Intelligence Platform with Authentication

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                       │
│         https://bhumi-survey-3d.vercel.app                │
│           (Vercel — static hosting, global CDN)           │
│                                                          │
│  React + TypeScript + Tailwind + Three.js + React Router │
│  AuthContext (JWT in httpOnly cookie / localStorage)     │
│  Axios → calls Render API with Authorization header      │
└──────────────────────┬───────────────────────────────────┘
                         │ HTTPS (CORS-enabled)
                         │
┌──────────────────────▼───────────────────────────────────┐
│               RENDER BACKEND                               │
│       https://bhumi-survey-3d-api.onrender.com            │
│                                                          │
│  FastAPI (Python) + CORS middleware                      │
│  Routes: auth, parcels, buildings, ULPIN, analysis,     │
│          validation, infrastructure, stats               │
│                                                          │
│  Postgres 15 database (Render add-on)                    │
│  Tables: parcels, buildings, floors, units, ulpins,      │
│          infrastructure, ai_jobs, validation_results,    │
│          users (NEW)                                     │
│                                                          │
│  .env variables:                                           │
│    DATABASE_URL=postgresql://user:pass@host:5432/db   │
│    JWT_SECRET=<random-64-chars>                          │
│    SECRET_KEY=<random-string>                            │
│    CORS_ORIGINS=https://bhumi-survey-3d.vercel.app         │
└──────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend host | **Vercel** | Global CDN, static file serving, automatic deploys from GitHub |
| Backend host | **Render** | Container-based Python server, always-on, PostgreSQL add-on |
| Database | **PostgreSQL 15** (Render managed) | All persistent data including user accounts |
| Frontend language | **TypeScript** | Type-safe React components |
| Frontend framework | **React 18** | UI framework |
| 3D rendering | **Three.js + React Three Fiber + Drei** | Interactive 3D city |
| Styling | **Tailwind CSS** | Utility-first CSS |
| Charts | **Recharts** | Dashboard visualizations |
| Backend language | **Python 3.12+** | FastAPI server |
| Backend framework | **FastAPI** | REST API with auto-docs |
| Auth | **python-jose / PyJWT + bcrypt** | JWT token generation + password hashing |
| CORS | **fastapi.middleware.cors.CORSMiddleware** | Allow only Vercel origin |
| Database ORM | **SQLAlchemy 2.0** | ORM + migration support |
| AI/Computer Vision | **OpenCV + NumPy + Pillow** | Building detection from photos |
| Container runtime | **Docker** (Render builds from Dockerfile) | Portable backend service |
| API client | **Axios** | HTTP calls from frontend to backend with auth headers |
| Auth state | **React Context API** | Global login state, token refresh |
| Routing | **React Router v6** | Page navigation + protected routes |
| Build tool (frontend) | **Vite** | Fast dev + production build |

---

## Environment Variables (`.env` files)

**Frontend — `frontend/.env.local`** (NOT committed to GitHub)
```
VITE_API_URL=https://bhumi-survey-3d-api.onrender.com
```

**Backend — `backend/.env`** (NOT committed to GitHub)
```
DATABASE_URL=postgresql://<user>:<password>@<render-host>:5432/<db-name>
JWT_SECRET=<64-character-random-string>
SECRET_KEY=<any-random-string>
CORS_ORIGINS=https://bhumi-survey-3d.vercel.app
UPLOAD_DIRECTORY=/app/uploads
```

**.env.example** files (committed to GitHub, safe to share):
- `frontend/.env.example` → `VITE_API_URL=http://localhost:8000`
- `backend/.env.example` → `DATABASE_URL=postgresql://localhost:5432/bhumi3d` + placeholder secrets

---

## API Communication Flow

```
User visits https://bhumi-survey-3d.vercel.app
       │
       ├── Login page → POST /api/auth/login → Render
       │     → Returns JWT token → stored in AuthContext
       │
       ├── Every subsequent request includes:
       │     Authorization: Bearer <JWT-token>
       │
       ├── Axios config (frontend/src/api/client.ts):
       │     baseURL = import.meta.env.VITE_API_URL
       │     headers['Authorization'] = `Bearer ${token}`
       │
       ├── CORS check on Render:
       │     Origin matches CORS_ORIGINS → allowed
       │     Otherwise → 403 Forbidden
       │
       └── Response → AuthContext updates → UI reflects logged-in state
```

---

## Authentication System Details

| Component | Details |
|---|---|
| **Signup** | `POST /api/auth/signup` — username, email, password → bcrypt hash → User row inserted |
| **Login** | `POST /api/auth/login` — email + password → verify hash → return JWT (expires 24h) |
| **Logout** | `POST /api/auth/logout` — clear client-side token, optional server-side invalidation |
| **Protected routes** | `AuthGuard` component wraps Dashboard, Map3D, Analysis, ULPIN, Validation, Infrastructure pages |
| **Public pages** | Landing, Login, Signup — accessible without token |
| **Password storage** | Never stored as plain text — always bcrypt hash (salt + hash) |
| **Token storage** | Frontend: `httpOnly` cookie (preferred) or `localStorage` with XSS mitigation |
| **User model** | `id, username, email, password_hash, created_at, properties_created[]` |
| **Admin seed** | `seed.py` creates default admin user on first run |

---

## Hosting Configuration

**Render (Backend)**
- Service type: **Web Service** (Docker)
- Build from: `backend/Dockerfile`
- Database: **PostgreSQL** add-on (Render provisions host, port, credentials)
- Env vars: Set in Render dashboard → Settings → Environment
- Auto-deploy: On `git push` to `main` branch

**Vercel (Frontend)**
- Import from: `bhumi-survey-3d` GitHub repo
- Framework preset: **Vite** (or React)
- Build command: `npm run build`
- Output directory: `dist`
- Env vars: `VITE_API_URL` → Render backend URL
- Auto-deploy: On `git push` to `main` branch
- `vercel.json`: rewrites `/api/*` → Render URL (for dev proxying)

---

## Git Workflow (New Repo)
```
Bhumi Survey 3D/
├── .git/                    ← Fresh init
├── .gitignore               ← Tracks: .env, node_modules, __pycache__, uploads, *.sqlite, *.db
├── README.md                ← Updated with new architecture & deploy guide
├── REPORT.md                ← Updated with new architecture
├── frontend/                ← Committed (minus .env.local, node_modules)
├── backend/                 ← Committed (minus .env, __pycache__, uploads)
├── database/                ← Committed
└── docker-compose.yml       ← Committed (updated)
```

---

## Deployment Sequence (Step-by-Step)

1. Push `main` to new GitHub repo → both Vercel and Render detect changes
2. **Render starts first**: builds backend Docker image → provisions Postgres → runs seed → health check at `/health`
3. **Vercel starts after**: builds frontend → injects `VITE_API_URL` → deploys to global edge
4. **Verify**: open Vercel URL → check browser console for API calls → check Render logs → confirm JWT flows
5. **Test auth**: Signup → Login → access protected page → logout

---

---

# FLOWCHART — Visual Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        START                                         │
│                  (Old repo has ownership issues)                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: NEW FOLDER                                                  │
│  Create Bhumi Survey 3D/ on your desktop                            │
│  DO NOT copy .git/ from old project                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: NEW GITHUB REPO                                             │
│  Go to github.com → New Repository → bhumi-survey-3d                │
│  Copy the remote URL                                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: INITIALIZE & PUSH                                         │
│  cd Bhumi Survey 3D/                                                │
│  git init                                                           │
│  Copy backend/ frontend/ database/ (NO node_modules, NO .git)       │
│  git add .                                                          │
│  git commit -m "initial: bhumi survey 3d v2"                       │
│  git remote add origin <new-github-url>                             │
│  git push -u origin main                                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: ADD AUTH SYSTEM                                             │
│  Backend: Add User model + auth.py routes (signup/login/logout)     │
│  Frontend: Add Login.tsx + Signup.tsx + AuthContext.tsx             │
│          + AuthGuard.tsx                                            │
│  Add bcrypt + PyJWT to requirements.txt                              │
│  Add auth libraries to package.json                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: ADD CORS + .env FILES                                       │
│  Backend: Add CORSMiddleware allowing Vercel origin                  │
│  Create backend/.env (DATABASE_URL, JWT_SECRET, SECRET_KEY,          │
│                       CORS_ORIGINS)                                 │
│  Create frontend/.env.local (VITE_API_URL)                           │
│  Add .env to .gitignore in both folders                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: UPDATE CONFIG FILES                                         │
│  vercel.json: set framework to Vite, add rewrites to Render API      │
│  Dockerfile (backend): update for Render                             │
│  Dockerfile (frontend): update for Vercel                            │
│  docker-compose.yml: remove Railway refs                             │
│  config.ts: use import.meta.env.VITE_API_URL                         │
│  client.ts: add Authorization header bearer token                    │
│  nginx.conf: proxy points to Render URL                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: FINAL PUSH                                                  │
│  git add .                                                          │
│  git commit -m "feat: auth + CORS + Vercel/Render hosting"          │
│  git push origin main                                               │
│  (Both Vercel and Render auto-deploy from main branch)               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8: DEPLOY                                                      │
│  Render: Create Web Service from backend/ + PostgreSQL add-on        │
│         Set env vars in Render dashboard                             │
│  Vercel: Import bhumi-survey-3d repo + set VITE_API_URL             │
│         env var in Vercel dashboard                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 9: VERIFY                                                      │
│  Open Vercel URL in browser                                        │
│  Check browser console for API calls (no CORS errors)                │
│  Test: Signup → Login → access protected page → logout               │
│  Test: Upload photo → Run AI → Generate ULPIN                       │
│  Test: Logout → Confirm protected pages redirect to Login            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DONE ✅                                       │
│   Live site: https://bhumi-survey-3d.vercel.app                     │
│   Live API:  https://bhumi-survey-3d-api.onrender.com              │
└─────────────────────────────────────────────────────────────────────┘
```

---

---

# CLARIFICATION QUESTIONS

Before I start building, please confirm:

1. **Login system type** — Should it be full email/password with JWT tokens (what I've described), or a simpler username/password session approach?

2. **New GitHub repo URL** — Do you already have the new repo created on github.com, or do you need help with that too?

3. **Auth scope** — Should every page (Dashboard, Map3D, Analysis, ULPIN, Validation, Infrastructure) require login, or only specific ones?

4. **When to start building** — Should I begin copying code into the new folder and adding auth once you confirm the above, or do you want to review the plan first and give a separate green-light?

---

*Document generated: September 2026*
*Project: Bhumi Survey 3D v2*
*Status: Planning phase — awaiting confirmation before build*