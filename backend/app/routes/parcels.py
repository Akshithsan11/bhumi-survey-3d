"""Bhumi Survey 3D - Parcel Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Parcel, User
from app.schemas import ParcelCreate, ParcelUpdate, ParcelResponse

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


@router.get("/", response_model=List[ParcelResponse])
async def list_parcels(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all parcels"""
    parcels = db.query(Parcel).offset(skip).limit(limit).all()
    return parcels


@router.get("/{parcel_id}", response_model=ParcelResponse)
async def get_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single parcel by ID"""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcel not found"
        )
    return parcel


@router.post("/", response_model=ParcelResponse, status_code=status.HTTP_201_CREATED)
async def create_parcel(
    parcel_data: ParcelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new parcel"""
    # Check if code already exists
    existing = db.query(Parcel).filter(Parcel.code == parcel_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parcel code already exists"
        )
    
    parcel = Parcel(
        code=parcel_data.code,
        name=parcel_data.name,
        area_sqm=parcel_data.area_sqm,
        location_lat=parcel_data.location_lat,
        location_lng=parcel_data.location_lng,
        owner_name=current_user.username,
        status="active"
    )
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.put("/{parcel_id}", response_model=ParcelResponse)
async def update_parcel(
    parcel_id: int,
    parcel_data: ParcelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update parcel"""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcel not found"
        )
    
    # Update fields
    if parcel_data.code:
        existing = db.query(Parcel).filter(Parcel.code == parcel_data.code).first()
        if existing and existing.id != parcel_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parcel code already exists"
            )
        parcel.code = parcel_data.code
    if parcel_data.name:
        parcel.name = parcel_data.name
    if parcel_data.area_sqm:
        parcel.area_sqm = parcel_data.area_sqm
    if parcel_data.location_lat:
        parcel.location_lat = parcel_data.location_lat
    if parcel_data.location_lng:
        parcel.location_lng = parcel_data.location_lng
    if parcel_data.status:
        parcel.status = parcel_data.status
    
    db.commit()
    db.refresh(parcel)
    return parcel


@router.delete("/{parcel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete parcel"""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcel not found"
        )
    
    # Delete associated buildings and data
    db.query(Building).filter(Building.parcel_id == parcel_id).delete()
    db.delete(parcel)
    db.commit()
    return None