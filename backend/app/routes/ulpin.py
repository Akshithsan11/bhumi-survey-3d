"""Bhumi Survey 3D - ULPIN Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ULPIN, User, Parcel, Building, Floor
from app.dependencies import get_current_user, get_optional_user
from app.schemas import ULPINCreate, ULPINResponse, PlotBuildCreate, PlotBuildResponse
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


@router.post("/generate-building", response_model=PlotBuildResponse, status_code=201)
async def generate_plot_building(
    data: PlotBuildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create parcel (if needed) + building + floors + ULPIN atomically."""
    plot_code = (data.plot_code or "").strip() or None
    if not plot_code:
        n = db.query(Parcel).count() + 1
        while True:
            candidate = f"PRC-M{n:03d}"
            if not db.query(Parcel).filter(Parcel.code == candidate).first():
                plot_code = candidate
                break
            n += 1

    parcel = db.query(Parcel).filter(Parcel.code == plot_code).first()
    if not parcel:
        parcel = Parcel(
            code=plot_code,
            name=f"Plot {plot_code}",
            area_sqm=str(round(data.size_sqm, 2)),
            owner_name=data.owner_name or current_user.username,
            status="active",
        )
        db.add(parcel)
        db.flush()

    building_code = (data.building_code or "").strip() or None
    if not building_code:
        n = db.query(Building).count() + 1
        while True:
            candidate = f"BLD-{n:03d}"
            if not db.query(Building).filter(Building.code == candidate).first():
                building_code = candidate
                break
            n += 1
    elif db.query(Building).filter(Building.code == building_code).first():
        raise HTTPException(409, f"Building code '{building_code}' already exists")

    height_m = round(data.floors * 3.4, 1)
    area_sqm = round(data.size_sqm, 2)
    building = Building(
        parcel_id=parcel.id,
        code=building_code,
        height_m=str(height_m),
        total_floors=data.floors,
        area_sqm=str(area_sqm),
        building_type=(data.building_type or "residential").lower(),
        status="active",
    )
    db.add(building)
    db.flush()

    for n in range(1, data.floors + 1):
        db.add(Floor(building_id=building.id, floor_number=n, floor_height_m="3.4", total_units=0))

    ulpin_code = generate_ulpin(plot_code=plot_code, building_code=building_code)
    sqft = round(area_sqm * 10.7639, 2)
    ulpin = ULPIN(
        property_id=building.id,
        ulpin_code=ulpin_code,
        plot_code=plot_code,
        building_code=building_code,
        total_area_sqm=str(area_sqm),
        total_area_sqft=str(sqft),
        owner_name=data.owner_name or current_user.username,
        validated=0,
    )
    db.add(ulpin)
    db.commit()
    db.refresh(building)
    db.refresh(ulpin)
    return PlotBuildResponse(
        building_id=building.id,
        building_code=building.code,
        parcel_id=parcel.id,
        plot_code=plot_code,
        floors_created=data.floors,
        height_m=height_m,
        area_sqm=area_sqm,
        total_area_sqft=sqft,
        ulpin_id=ulpin.id,
        ulpin_code=ulpin.ulpin_code,
    )