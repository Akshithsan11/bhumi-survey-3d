"""Bhumi Survey 3D - Infrastructure Routes"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Infrastructure, Building
from app.dependencies import get_current_user, get_optional_user
from app.schemas import InfrastructureCreate, InfrastructureResponse

router = APIRouter(prefix="/api/infrastructure", tags=["infrastructure"])


class ConflictCheckRequest(BaseModel):
    building_id: int
    depth_m: float = 3.0


@router.get("", response_model=list[InfrastructureResponse])
@router.get("/", response_model=list[InfrastructureResponse])
async def list_infrastructure(
    building_id: int | None = None,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    q = db.query(Infrastructure)
    if building_id:
        q = q.filter(Infrastructure.building_id == building_id)
    return q.offset(skip).limit(limit).all()


@router.post("", response_model=InfrastructureResponse, status_code=201)
@router.post("/", response_model=InfrastructureResponse, status_code=201)
async def create_infrastructure(
    data: InfrastructureCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    infra = Infrastructure(**data.model_dump(), status="active")
    db.add(infra)
    db.commit()
    db.refresh(infra)
    return infra


@router.post("/conflict-check")
async def check_conflicts(
    data: ConflictCheckRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    building_id = data.building_id
    depth_m = data.depth_m
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(404, "Building not found")

    conflicts = []
    infra_list = db.query(Infrastructure).filter(
        Infrastructure.building_id == building_id
    ).all()
    for infra in infra_list:
        if infra.depth_m and float(infra.depth_m) <= depth_m + 1.0:
            conflicts.append({
                "infrastructure_id": infra.id,
                "type": infra.type,
                "name": infra.name,
                "depth_m": infra.depth_m,
                "owner": infra.owner_authority,
                "severity": "high" if float(infra.depth_m) < depth_m else "medium",
            })

    return {
        "building_id": building_id,
        "foundation_depth_m": depth_m,
        "total_conflicts": len(conflicts),
        "conflicts": conflicts,
        "safe_to_dig": len(conflicts) == 0,
    }