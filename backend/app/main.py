"""Bhumi Survey 3D - FastAPI Backend Application"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
import bcrypt
import json
import os
from datetime import datetime, timedelta

# Import database and models
from .database import engine, Base, SessionLocal
from .models import User

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bhumi Survey 3D API",
    description="3D Property Intelligence Platform API",
    version="2.0.0"
)

# CORS - Allow specific origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bhumi-survey-3d.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bearer token schema
security = HTTPBearer()

# Pydantic models for auth
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours

# In-memory user store (replace with database in production)
fake_users_db = {}
token_blocklist = set()

@app.on_event("startup")
async def startup():
    """Create initial admin user if not exists"""
    from passlib.context import CryptContext
    from sqlalchemy.orm import Session
    
    db: Session = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            # Create admin
            hashed_password = bcrypt.hashpw("REDACTED", bcrypt.gensalt()).decode()
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=hashed_password
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created successfully")
        else:
            print("✅ Admin user already exists")
    except Exception as e:
        print(f"⚠️  Startup warning: {e}")
    finally:
        db.close()

# Endpoints
@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Welcome to Bhumi Survey 3D API",
        "version": "2.0.0",
        "docs": "/docs",
        "auth": "/api/auth/login"
    }

@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# ===== AUTH ENDPOINTS =====

@app.post("/api/auth/signup", response_model=Token, tags=["auth"])
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT token
    from .auth import create_access_token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        subject=new_user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@app.post("/api/auth/login", response_model=Token, tags=["auth"])
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and get JWT token"""
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not bcrypt.checkpw(user_data.password.encode(), user.password_hash.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT token
    from .auth import create_access_token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@app.post("/api/auth/logout", tags=["auth"])
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user (invalidate token)"""
    token_blocklist.add(credentials.credentials)
    return {"message": "Successfully logged out"}

# Dependency to get current user
from fastapi.security import OAuth2AuthorizationCodeBearer

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy.orm import Session

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user from JWT token"""
    from .auth import decode_access_token
    
    token = credentials.credentials
    if token in token_blocklist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been invalidated"
        )
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@app.get("/api/users/me", response_model=UserResponse, tags=["auth"])
async def get_current_user_endpoint(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

# ===== OTHER API ENDPOINTS (placeholders) =====

@app.get("/api/parcels", tags=["parcels"])
async def list_parcels(db: Session = Depends(get_db)):
    """List all parcels"""
    parcels = db.query(User).all()  # Placeholder
    return {"count": len(parcels), "items": parcels}

@app.get("/api/buildings", tags=["buildings"])
async def list_buildings(db: Session = Depends(get_db)):
    """List all buildings"""
    return {"count": 0, "items": []}  # Placeholder

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)