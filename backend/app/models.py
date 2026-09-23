"""Bhumi Survey 3D - SQLAlchemy Models"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, inspect
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


# ===== Users Table (Authentication) =====

class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    ai_jobs = relationship("AIJob", back_populates="owner", cascade="all, delete-orphan")
    validation_results = relationship(
        "ValidationResult", back_populates="owner", cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User {self.username}>"
    
    def check_password(self, password: str) -> bool:
        """Check password against hash"""
        from app.services.auth import verify_password
        return verify_password(password, self.password_hash)
    
    def set_password(self, password: str):
        """Hash and set password"""
        from app.services.auth import get_password_hash
        self.password_hash = get_password_hash(password)


# ===== Parcels Table =====

class Parcel(Base):
    """Land parcel table"""
    __tablename__ = "parcels"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100))
    area_sqm = Column(String(20))
    location_lat = Column(String(15))
    location_lng = Column(String(15))
    owner_name = Column(String(100))
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    buildings = relationship("Building", back_populates="parcel", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Parcel {self.code}>"


# ===== Buildings Table =====

class Building(Base):
    """Buildings/towers table"""
    __tablename__ = "buildings"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    height_m = Column(String(10))
    total_floors = Column(Integer, default=0)
    building_type = Column(String(50), default="residential")
    ai_confidence = Column(String(10))
    ai_model_version = Column(String(50), default="v1.0")
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relationships
    parcel = relationship("Parcel", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    infrastructure = relationship(
        "Infrastructure", back_populates="building", cascade="all, delete-orphan"
    )
    validation_results = relationship(
        "ValidationResult", back_populates="building", cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Building {self.code}>"


# ===== Floors Table =====

class Floor(Base):
    """Floors table"""
    __tablename__ = "floors"
    
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    floor_number = Column(Integer, nullable=False)
    floor_height_m = Column(String(10))
    total_units = Column(Integer, default=0)
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    building = relationship("Building", back_populates="floors")
    units = relationship("PropertyUnit", back_populates="floor", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Floor {self.floor_number} of Building {self.building_id}>"


# ===== Property Units (Flats) Table =====

class PropertyUnit(Base):
    """Property units (flats) table"""
    __tablename__ = "property_units"
    
    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_number = Column(String(20))
    area_sqft = Column(String(15))
    unit_type = Column(String(50), default="residential")
    occupancy_status = Column(String(20), default="vacant")
    owner_name = Column(String(100))
    rent = Column(String(15))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    floor = relationship("Floor", back_populates="units")
    
    def __repr__(self):
        return f"<Unit {self.unit_number}>"


# ===== ULPIN Records Table =====

class ULPIN(Base):
    """ULPIN property ID records table"""
    __tablename__ = "ulpins"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=True, index=True)
    ulpin_code = Column(String(50), unique=True, nullable=False)
    country_code = Column(String(10), default="IND")
    state_code = Column(String(10), default="TG")
    city_code = Column(String(10), default="HYD")
    plot_code = Column(String(20))
    building_code = Column(String(20))
    floor_code = Column(String(10))
    unit_code = Column(String(10))
    total_area_sqm = Column(String(20))
    total_area_sqft = Column(String(20))
    owner_name = Column(String(100))
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    validated = Column(Integer, default=0)
    ai_confidence = Column(String(10))
    
    def __repr__(self):
        return f"<ULPIN {self.ulpin_code}>"


# ===== Infrastructure Table =====

class Infrastructure(Base):
    """Underground infrastructure table"""
    __tablename__ = "infrastructure"
    
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(50), nullable=False)
    name = Column(String(100))
    depth_m = Column(String(10))
    length_m = Column(String(15))
    owner_authority = Column(String(100))
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    building = relationship("Building", back_populates="infrastructure")
    
    def __repr__(self):
        return f"<Infra {self.name}>"


# ===== AI Jobs Table =====

class AIJob(Base):
    """AI analysis jobs table"""
    __tablename__ = "ai_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    input_image_path = Column(String(255))
    detected_buildings = Column(Integer, default=0)
    avg_confidence = Column(String(10))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="ai_jobs")


# ===== Validation Results Table =====

class ValidationResult(Base):
    """Validation results table"""
    __tablename__ = "validation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    overall_score = Column(Integer, default=0)
    passed_rules = Column(Integer, default=0)
    failed_rules = Column(JSONB, default="[]")
    validation_type = Column(String(50), default="standard")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="validation_results")
    building = relationship("Building", back_populates="validation_results")
    
    def __repr__(self):
        return f"<Validation {self.id}>"