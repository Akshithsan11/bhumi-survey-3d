"""Bhumi Survey 3D - Validation Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Building, ValidationResult
from app.dependencies import get_current_user
from app.schemas import ValidationRequest, ValidationResponse

router = APIRouter(prefix="/api/validation", tags=["validation"])


@router.get("/", response_model=list[ValidationResponse])
async def list_validations(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(ValidationResult).offset(skip).limit(limit).all()


@router.post("/", response_model=ValidationResponse, status_code=201)
async def run_validation(
    data: ValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building = db.query(Building).filter(Building.id == data.building_id).first()
    if not building:
        raise HTTPException(404, "Building not found")

    rules = []
    passed = 0
    failed = []

    if building.height_m and float(building.height_m) > 0:
        rules.append("height_positive")
        passed += 1
    if building.total_floors and building.total_floors > 0:
        rules.append("floors_defined")
        passed += 1
    if building.building_type:
        rules.append("type_specified")
        passed += 1
    if building.parcel_id:
        rules.append("has_parcel")
        passed += 1

    floor_height_ok = True
    if building.total_floors and building.height_m and building.total_floors > 0:
        avg = float(building.height_m) / building.total_floors
        if avg < 2.5 or avg > 4.5:
            floor_height_ok = False

    if floor_height_ok:
        rules.append("floor_height_reasonable")
        passed += 1
    else:
        failed.append("floor_height_reasonable")

    score = int((passed / 6) * 100)

    result = ValidationResult(
        building_id=building.id,
        user_id=current_user.id,
        overall_score=score,
        passed_rules=passed,
        failed_rules=failed,
        validation_type="standard",
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result