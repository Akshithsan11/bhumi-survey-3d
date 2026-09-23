"""Bhumi Survey 3D - Floor Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Building, Floor, PropertyUnit, User
from app.dependencies import get_current_user
from app.schemas import FloorCreate, FloorUpdate, FloorResponse

router = APIRouter(prefix="/api/floors", tags=["floors"])


@router.get("", response_model=list[FloorResponse])
@router.get("/", response_model=list[FloorResponse])
async def list_floors(
    building_id: int | None = None,
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Floor)
    if building_id:
        q = q.filter(Floor.building_id == building_id)
    return q.offset(skip).limit(limit).all()


@router.get("/{floor_id}", response_model=FloorResponse)
async def get_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    f = db.query(Floor).filter(Floor.id == floor_id).first()
    if not f:
        raise HTTPException(404, "Floor not found")
    return f


@router.post("/{building_id}", response_model=FloorResponse, status_code=201)
async def create_floor(
    building_id: int, data: FloorCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.query(Building).filter(Building.id == building_id).first():
        raise HTTPException(404, "Building not found")
    if db.query(Floor).filter(
        Floor.building_id == building_id, Floor.floor_number == data.floor_number
    ).first():
        raise HTTPException(400, f"Floor {data.floor_number} already exists")
    f = Floor(building_id=building_id, **data.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@router.put("/{floor_id}", response_model=FloorResponse)
async def update_floor(
    floor_id: int, data: FloorUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    f = db.query(Floor).filter(Floor.id == floor_id).first()
    if not f:
        raise HTTPException(404, "Floor not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(f, key, value)
    db.commit()
    db.refresh(f)
    return f


@router.delete("/{floor_id}", status_code=204)
async def delete_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    f = db.query(Floor).filter(Floor.id == floor_id).first()
    if not f:
        raise HTTPException(404, "Floor not found")
    db.query(PropertyUnit).filter(PropertyUnit.floor_id == floor_id).delete()
    db.delete(f)
    db.commit()