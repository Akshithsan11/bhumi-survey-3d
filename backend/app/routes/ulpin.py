"""Bhumi Survey 3D - ULPIN Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ULPIN, User
from app.dependencies import get_current_user, get_optional_user
from app.models import Building
from app.schemas import ULPINCreate, ULPINResponse
from app.services.ulpin import generate_ulpin, validate_ulpin_format

router = APIRouter(prefix="/api/ulpin", tags=["ulpin"])


@router.get("", response_model=list[ULPINResponse])
@router.get("/", response_model=list[ULPINResponse])
async def list_ulpins(
    skip: int = 0, limit: int = 100,
    building_code: str | None = None,
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    q = db.query(ULPIN).order_by(ULPIN.generated_at.desc())
    if building_code:
        q = q.filter(ULPIN.building_code == building_code)
    return q.offset(skip).limit(limit).all()


@router.get("/validate")
async def validate_ulpin_endpoint(
    ulpin_code: str,
    _: User | None = Depends(get_optional_user),
):
    result = validate_ulpin_format(ulpin_code)
    return result


@router.get("/{ulpin_id}", response_model=ULPINResponse)
async def get_ulpin(
    ulpin_id: int,
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    u = db.query(ULPIN).filter(ULPIN.id == ulpin_id).first()
    if not u:
        raise HTTPException(404, "ULPIN record not found")
    return u


@router.post("/generate", response_model=ULPINResponse, status_code=201)
async def generate_new_ulpin(
    data: ULPINCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = generate_ulpin(
        plot_code=data.plot_code,
        building_code=data.building_code,
        floor_code=data.floor_code,
        unit_code=data.unit_code,
    )
    property_id = data.property_id
    if property_id is None and data.building_code:
        b = db.query(Building).filter(Building.code == data.building_code).first()
        if b:
            property_id = b.id
    ulpin = ULPIN(
        property_id=property_id,
        ulpin_code=code,
        plot_code=data.plot_code,
        building_code=data.building_code,
        floor_code=data.floor_code,
        unit_code=data.unit_code,
        owner_name=data.owner_name or current_user.username,
        validated=0,
    )
    db.add(ulpin)
    db.commit()
    db.refresh(ulpin)
    return ulpin