"""Bhumi Survey 3D - Parcel Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Parcel, Building, User
from app.dependencies import get_current_user, get_optional_user
from app.schemas import ParcelCreate, ParcelUpdate, ParcelResponse

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


@router.get("", response_model=list[ParcelResponse])
@router.get("/", response_model=list[ParcelResponse])
async def list_parcels(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    return db.query(Parcel).offset(skip).limit(limit).all()


@router.get("/{parcel_id}", response_model=ParcelResponse)
async def get_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(404, "Parcel not found")
    return parcel


@router.post("", response_model=ParcelResponse, status_code=201)
@router.post("/", response_model=ParcelResponse, status_code=201)
async def create_parcel(
    data: ParcelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Parcel).filter(Parcel.code == data.code).first():
        raise HTTPException(400, "Parcel code already exists")
    parcel = Parcel(**data.model_dump(), owner_name=current_user.username, status="active")
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.put("/{parcel_id}", response_model=ParcelResponse)
async def update_parcel(
    parcel_id: int, data: ParcelUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(404, "Parcel not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(parcel, key, value)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.delete("/{parcel_id}", status_code=204)
async def delete_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(404, "Parcel not found")
    db.query(Building).filter(Building.parcel_id == parcel_id).delete()
    db.delete(parcel)
    db.commit()