"""Bhumi Survey 3D - Dashboard Stats Routes"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Parcel, Building, Floor, PropertyUnit,
    ULPIN, Infrastructure,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/dashboard")
async def dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    buildings_count = db.query(func.count(Building.id)).scalar() or 0
    parcels_count = db.query(func.count(Parcel.id)).scalar() or 0
    floors_count = db.query(func.count(Floor.id)).scalar() or 0
    units_count = db.query(func.count(PropertyUnit.id)).scalar() or 0
    ulpins_count = db.query(func.count(ULPIN.id)).scalar() or 0
    infra_count = db.query(func.count(Infrastructure.id)).scalar() or 0

    confidences = db.query(Building.ai_confidence).filter(
        Building.ai_confidence.isnot(None)
    ).all()
    avg_conf = 0.0
    if confidences:
        vals = [float(c[0]) for c in confidences if c[0]]
        avg_conf = round(sum(vals) / len(vals), 1) if vals else 0.0

    return {
        "buildings": buildings_count,
        "parcels": parcels_count,
        "floors": floors_count,
        "units": units_count,
        "ulpins": ulpins_count,
        "underground_assets": infra_count,
        "avg_confidence": avg_conf,
    }


@router.get("/building-types")
async def building_type_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(Building.building_type, func.count(Building.id))
        .group_by(Building.building_type)
        .all()
    )
    return [{"type": r[0] or "unknown", "count": r[1]} for r in rows]