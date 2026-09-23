"""Bhumi Survey 3D - Building Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Building, Parcel
from app.schemas import BuildingCreate, BuildingUpdate, BuildingResponse

router = APIRouter(prefix="/api/buildings", tags=["buildings"])


@router.get("/", response_model=List[BuildingResponse])
async def list_buildings(
    parcel_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List buildings, optionally filtered by parcel"""
    query = db.query(Building)
    if parcel_id:
        query = query.filter(Building.parcel_id == parcel_id)
    buildings = query.offset(skip).limit(limit).all()
    return buildings


@router.get("/{building_id}", response_model=BuildingResponse)
async def get_building(
    building_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single building by ID"""
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Building not found"
        )
    return building


@router.post("/", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
async def create_building(
    building_data: BuildingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new building"""
    # Check if parcel exists
    parcel = db.query(Parcel).filter(Parcel.id == building_data.parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent parcel not found"
        )
    
    # Check if code already exists for this parcel
    existing = db.query(Building).filter(
        Building.code == building_data.code,
        Building.parcel_id == building_data.parcel_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Building code already exists for this parcel"
        )
    
    building = Building(
        code=building_data.code,
        parcel_id=building_data.parcel_id,
        height_m=building_data.height_m,
        total_floors=building_data.total_floors,
        building_type=building_data.building_type,
        ai_confidence=building_data.ai_confidence,
        status="active"
    )
    db.add(building)
    db.commit()
    db.refresh(building)
    return building


@router.put("/{building_id}", response_model=BuildingResponse)
async def update_building(
    building_id: int,
    building_data: BuildingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update building"""
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Building not found"
        )
    
    if building_data.code:
        existing = db.query(Building).filter(
            Building.code == building_data.code,
            Building.parcel_id == building.parcel_id
        ).first()
        if existing and existing.id != building_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Building code already exists for this parcel"
            )
        building.code = building_data.code
    if building_data.height_m:
        building.height_m = building_data.height_m
    if building_data.total_floors:
        building.total_floors = building_data.total_floors
    if building_data.building_type:
        building.building_type = building_data.building_type
    if building_data.ai_confidence:
        building.ai_confidence = building_data.ai_confidence
    if building_data.status:
        building.status = building_data.status
    
    db.commit()
    db.refresh(building)
    return building


@router.delete("/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_building(
    building_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete building"""
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Building not found"
        )
    db.delete(building)
    db.commit()
    return None