"""Bhumi Survey 3D - Building Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Building, Parcel, User
from app.dependencies import get_current_user
from app.schemas import BuildingCreate, BuildingUpdate, BuildingResponse

router = APIRouter(prefix="/api/buildings", tags=["buildings"])


@router.get("", response_model=list[BuildingResponse])
@router.get("/", response_model=list[BuildingResponse])
async def list_buildings(
    parcel_id: int | None = None,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Building)
    if parcel_id:
        q = q.filter(Building.parcel_id == parcel_id)
    return q.offset(skip).limit(limit).all()


@router.get("/{building_id}", response_model=BuildingResponse)
async def get_building(
    building_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(404, "Building not found")
    return b


@router.post("", response_model=BuildingResponse, status_code=201)
@router.post("/", response_model=BuildingResponse, status_code=201)
async def create_building(
    data: BuildingCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.query(Parcel).filter(Parcel.id == data.parcel_id).first():
        raise HTTPException(404, "Parcel not found")
    b = Building(**data.model_dump(), status="active")
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{building_id}", response_model=BuildingResponse)
async def update_building(
    building_id: int, data: BuildingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(404, "Building not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(b, key, value)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{building_id}", status_code=204)
async def delete_building(
    building_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(404, "Building not found")
    db.delete(b)
    db.commit()