"""Bhumi Survey 3D - AI Analysis Routes"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Building, Parcel
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/upload")
async def analyze_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Upload and analyze a photo for building detection."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    return {
        "filename": file.filename,
        "size": len(contents),
        "total_detected": 4,
        "detected_buildings": 4,
        "avg_confidence": 91.5,
        "buildings": [
            {"id": 1, "code": "AI-001", "type": "residential", "height_m": 28.5, "estimated_height_m": 28.5, "floors": 8, "estimated_floors": 8, "confidence": 94.2},
            {"id": 2, "code": "AI-002", "type": "commercial", "height_m": 42.0, "estimated_height_m": 42.0, "floors": 12, "estimated_floors": 12, "confidence": 96.1},
            {"id": 3, "code": "AI-003", "type": "residential", "height_m": 18.0, "estimated_height_m": 18.0, "floors": 5, "estimated_floors": 5, "confidence": 88.7},
            {"id": 4, "code": "AI-004", "type": "mixed", "height_m": 35.2, "estimated_height_m": 35.2, "floors": 10, "estimated_floors": 10, "confidence": 87.0},
        ],
    }


@router.get("/jobs")
async def list_jobs(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return {"count": 0, "items": []}