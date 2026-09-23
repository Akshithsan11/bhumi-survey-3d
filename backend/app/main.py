"""Bhumi Survey 3D - FastAPI Backend Application"""

import os
from datetime import timedelta

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db, engine, Base
from app.models import User, Parcel, Building, Floor, PropertyUnit
from app.routes.auth import router as auth_router
from app.routes.parcels import router as parcels_router
from app.routes.buildings import router as buildings_router
from app.routes.floors import router as floors_router
from app.routes.units import router as units_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bhumi Survey 3D API",
    description="3D Property Intelligence Platform API v2",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bhumi-survey-3d.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bearer token security
security = HTTPBearer(auto_error=False)


# ===== INCLUDE ROUTERS =====
app.include_router(auth_router)
app.include_router(parcels_router)
app.include_router(buildings_router)
app.include_router(floors_router)
app.include_router(units_router)


# ===== ROOT & HEALTH =====

@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Bhumi Survey 3D API",
        "version": "2.0.0",
        "docs": "/docs",
        "auth_endpoint": "/api/auth/login",
        "status": "active",
    }


@app.get("/health", tags=["health"], include_in_schema=False)
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": __import__("datetime").datetime.utcnow(),
        "service": "bhumi-survey-3d-api",
    }


# ===== AUTH DEPENDENCY =====

def get_db():
    """Get database session"""
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """Get current authenticated user from JWT token"""
    from app.services.auth import decode_access_token

    if credentials is None:
        return None

    token = credentials.credentials
    from app.services.auth import token_blocklist
    if token in token_blocklist:
        return None

    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id: str = payload.get("sub")
    if user_id is None:
        return None

    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except (ValueError, TypeError):
        return None


# ===== API ENDPOINTS =====

@app.get("/api/users/me", response_model=UserResponse, tags=["auth"])
async def get_current_user_endpoint(
    current_user: Optional[User] = Depends(get_current_user),
):
    """Get current user profile"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return current_user


# ===== LEGACY/OTHER ENDPOINTS =====

@app.get("/api/test", tags=["test"])
async def test_endpoint():
    """Test endpoint"""
    return {"status": "ok", "message": "API is working"}


# ===== RUN THE APP =====

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
    )