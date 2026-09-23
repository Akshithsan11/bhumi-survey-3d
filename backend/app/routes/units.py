"""Bhumi Survey 3D - Property Unit Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Floor, PropertyUnit, User
from app.dependencies import get_current_user
from app.schemas import UnitCreate, UnitUpdate, UnitResponse

router = APIRouter(prefix="/api/units", tags=["units"])


@router.get("", response_model=list[UnitResponse])
@router.get("/", response_model=list[UnitResponse])
async def list_units(
    floor_id: int | None = None,
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(PropertyUnit)
    if floor_id:
        q = q.filter(PropertyUnit.floor_id == floor_id)
    return q.offset(skip).limit(limit).all()


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    u = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    return u


@router.post("/{floor_id}", response_model=UnitResponse, status_code=201)
async def create_unit(
    floor_id: int, data: UnitCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.query(Floor).filter(Floor.id == floor_id).first():
        raise HTTPException(404, "Floor not found")
    u = PropertyUnit(floor_id=floor_id, **data.model_dump())
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int, data: UnitUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    u = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(u, key, value)
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    u = db.query(PropertyUnit).filter(PropertyUnit.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    db.delete(u)
    db.commit()