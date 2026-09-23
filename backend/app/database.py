"""Bhumi Survey 3D - Database Configuration"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Database URL - will be overridden by Render DATABASE_URL env var
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/bhumi3d"
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,  # Set to True for SQL debugging
)

# Create session local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Dependency to get database session
def get_db():
    """Yield a database session, automatically closing after use"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database utility functions
def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables initialized")


def close_db():
    """Close database connections"""
    engine.dispose()
    print("🔌 Database connections closed")