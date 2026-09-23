"""Bhumi Survey 3D - Floor Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Building, Floor, PropertyUnit
from app.schemas import FloorCreate, FloorUpdate, FloorResponse, UnitCreate, UnitUpdate, UnitResponse

router = APIRouter(prefix="/api/floors", tags=["floors"])


@router.get("/", response_model=List[FloorResponse])
async def list_floors(
    building_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List floors, optionally filtered by building"""
    query = db.query(Floor)
    if building_id:
        query = query.filter(Floor.building_id == building_id)
    floors = query.offset(skip).limit(limit).all()
    return floors


@router.get("/{floor_id}", response_model=FloorResponse)
async def get_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single floor by ID"""
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found"
        )
    return floor


@router.post("/{building_id}", response_model=FloorResponse, status_code=status.HTTP_201_CREATED)
async def create_floor(
    building_id: int,
    floor_data: FloorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new floor"""
    # Check building exists
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Building not found"
        )
    
    # Check floor number doesn't already exist
    existing = db.query(Floor).filter(
        Floor.building_id == building_id,
        Floor.floor_number == floor_data.floor_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Floor {floor_data.floor_number} already exists"
        )
    
    floor = Floor(
        building_id=building_id,
        floor_number=floor_data.floor_number,
        floor_height_m=floor_data.floor_height_m,
        total_units=floor_data.total_units
    )
    db.add(floor)
    db.commit()
    db.refresh(floor)
    return floor


@router.put("/{floor_id}", response_model=FloorResponse)
async def update_floor(
    floor_id: int,
    floor_data: FloorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update floor"""
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found"
        )
    
    if floor_data.floor_height_m:
        floor.floor_height_m = floor_data.floor_height_m
    if floor_data.total_units:
        floor.total_units = floor_data.total_units
    if floor_data.status:
        floor.status = floor_data.status
    
    db.commit()
    db.refresh(floor)
    return floor


@router.delete("/{floor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete floor"""
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found"
        )
    # Delete associated units
    db.query(PropertyUnit).filter(PropertyUnit.floor_id == floor_id).delete()
    db.delete(floor)
    db.commit()
    return None