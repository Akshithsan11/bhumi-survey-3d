"""Bhumi Survey 3D - Property Unit (Flat) Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Floor, PropertyUnit
from app.schemas import UnitCreate, UnitUpdate, UnitResponse

router = APIRouter(prefix="/api/units", tags=["units"])


@router.get("/", response_model=List[UnitResponse])
async def list_units(
    floor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List units, optionally filtered by floor"""
    query = db.query(PropertyUnit)
    if floor_id:
        query = query.filter(PropertyUnit.floor_id == floor_id)
    units = query.offset(skip).limit(limit).all()
    return units


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single unit by ID"""
    unit = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    return unit


@router.post("/{floor_id}", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    floor_id: int,
    unit_data: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new unit (flat)"""
    # Check floor exists
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor not found"
        )
    
    # Check unit number doesn't already exist on this floor
    existing = db.query(PropertyUnit).filter(
        PropertyUnit.floor_id == floor_id,
        PropertyUnit.unit_number == unit_data.unit_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unit {unit_data.unit_number} already exists on this floor"
        )
    
    unit = PropertyUnit(
        floor_id=floor_id,
        unit_number=unit_data.unit_number,
        area_sqft=unit_data.area_sqft,
        unit_type=unit_data.unit_type,
        occupancy_status=unit_data.occupancy_status,
        owner_name=unit_data.owner_name,
        rent=unit_data.rent
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int,
    unit_data: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update unit"""
    unit = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    
    if unit_data.unit_number:
        existing = db.query(PropertyUnit).filter(
            PropertyUnit.floor_id == unit.floor_id,
            PropertyUnit.unit_number == unit_data.unit_number
        ).first()
        if existing and existing.id != unit_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unit {unit_data.unit_number} already exists on this floor"
            )
        unit.unit_number = unit_data.unit_number
    if unit_data.area_sqft:
        unit.area_sqft = unit_data.area_sqft
    if unit_data.unit_type:
        unit.unit_type = unit_data.unit_type
    if unit_data.occupancy_status:
        unit.occupancy_status = unit_data.occupancy_status
    if unit_data.owner_name:
        unit.owner_name = unit_data.owner_name
    if unit_data.rent:
        unit.rent = unit_data.rent
    
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete unit"""
    unit = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    db.delete(unit)
    db.commit()
    return None