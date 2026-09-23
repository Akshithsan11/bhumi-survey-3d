"""Bhumi Survey 3D - Authentication Module"""

import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET", "bhumi-survey-3d-jwt-secret-key-2024-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    # Ensure subject is a string
    sub = str(subject)
    
    to_encode = {
        "sub": sub,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None
    
def get_token_expiry(token: str) -> Optional[datetime]:
    """Get token expiry datetime"""
    payload = decode_access_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return None

def is_token_valid(token: str) -> bool:
    """Check if token is valid and not expired"""
    payload = decode_access_token(token)
    if payload is None:
        return False
    
    # Check expiration
    if "exp" in payload:
        expire = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        if expire < datetime.now(timezone.utc):
            return False
    
    return True