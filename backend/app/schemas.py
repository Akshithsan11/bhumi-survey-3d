"""Bhumi Survey 3D - Pydantic Schemas"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ===== Auth Schemas =====

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


class ChangePasswordResponse(BaseModel):
    message: str
    reauth_required: bool = False


# ===== Parcel Schemas =====

class ParcelCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=20)
    name: Optional[str] = None
    area_sqm: Optional[str] = None
    location_lat: Optional[str] = None
    location_lng: Optional[str] = None


class ParcelUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    area_sqm: Optional[str] = None
    location_lat: Optional[str] = None
    location_lng: Optional[str] = None
    status: Optional[str] = None


class ParcelResponse(BaseModel):
    id: int
    code: str
    name: Optional[str]
    area_sqm: Optional[str]
    location_lat: Optional[str]
    location_lng: Optional[str]
    owner_name: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Building Schemas =====

class BuildingCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=20)
    parcel_id: int
    height_m: Optional[str] = None
    total_floors: Optional[int] = None
    building_type: Optional[str] = "residential"
    ai_confidence: Optional[str] = None


class BuildingUpdate(BaseModel):
    code: Optional[str] = None
    height_m: Optional[str] = None
    total_floors: Optional[int] = None
    building_type: Optional[str] = None
    ai_confidence: Optional[str] = None
    status: Optional[str] = None


class BuildingResponse(BaseModel):
    id: int
    parcel_id: int
    code: str
    height_m: Optional[str]
    total_floors: Optional[int]
    building_type: Optional[str]
    ai_confidence: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Floor Schemas =====

class FloorCreate(BaseModel):
    floor_number: int = Field(..., ge=0)
    floor_height_m: Optional[str] = None
    total_units: Optional[int] = 0


class FloorUpdate(BaseModel):
    floor_height_m: Optional[str] = None
    total_units: Optional[int] = None
    status: Optional[str] = None


class FloorResponse(BaseModel):
    id: int
    building_id: int
    floor_number: int
    floor_height_m: Optional[str]
    total_units: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Unit Schemas =====

class UnitCreate(BaseModel):
    unit_number: str = Field(..., min_length=1, max_length=20)
    area_sqft: Optional[str] = None
    unit_type: Optional[str] = "residential"
    occupancy_status: Optional[str] = "vacant"
    owner_name: Optional[str] = None
    rent: Optional[str] = None


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    area_sqft: Optional[str] = None
    unit_type: Optional[str] = None
    occupancy_status: Optional[str] = None
    owner_name: Optional[str] = None
    rent: Optional[str] = None


class UnitResponse(BaseModel):
    id: int
    floor_id: int
    unit_number: Optional[str]
    area_sqft: Optional[str]
    unit_type: str
    occupancy_status: str
    owner_name: Optional[str]
    rent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ===== ULPIN Schemas =====

class ULPINCreate(BaseModel):
    property_id: Optional[int] = None
    plot_code: str
    building_code: Optional[str] = None
    floor_code: Optional[str] = None
    unit_code: Optional[str] = None
    owner_name: Optional[str] = None


class ULPINResponse(BaseModel):
    id: int
    ulpin_code: str
    country_code: str
    state_code: str
    city_code: str
    plot_code: Optional[str]
    building_code: Optional[str]
    floor_code: Optional[str]
    unit_code: Optional[str]
    total_area_sqm: Optional[str]
    total_area_sqft: Optional[str]
    owner_name: Optional[str]
    generated_at: datetime
    validated: int
    ai_confidence: Optional[str]

    class Config:
        from_attributes = True


# ===== Infrastructure Schemas =====

class InfrastructureCreate(BaseModel):
    building_id: Optional[int] = None
    type: str = Field(..., min_length=2, max_length=50)
    name: Optional[str] = None
    depth_m: Optional[str] = None
    length_m: Optional[str] = None
    owner_authority: Optional[str] = None


class InfrastructureResponse(BaseModel):
    id: int
    building_id: Optional[int]
    type: str
    name: Optional[str]
    depth_m: Optional[str]
    length_m: Optional[str]
    owner_authority: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Validation Schemas =====

class ValidationRequest(BaseModel):
    building_id: int


class ValidationResponse(BaseModel):
    id: int
    building_id: Optional[int]
    overall_score: int
    passed_rules: int
    failed_rules: Optional[List[str]]
    validation_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Stats Schemas =====

class DashboardStats(BaseModel):
    buildings: int
    parcels: int
    floors: int
    units: int
    ulpins: int
    avg_confidence: float
    total_area_sqm: float
    underground_assets: int