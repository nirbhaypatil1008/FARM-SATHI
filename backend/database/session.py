"""
Database Engine and Session Configuration.
Supports PostgreSQL (Supabase) with seamless fallback to SQLite for local development.
"""

from typing import Generator
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from utils.config import settings
from database.base import Base

logger = logging.getLogger("krishi_saathi.database")

# Ensure PostgreSQL URL scheme is SQLAlchemy-compatible (fix postgres:// to postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure engine arguments based on database dialect
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        echo=False,  # Set to True if SQL query debugging is desired
        pool_pre_ping=True
    )
except Exception as e:
    logger.warning(f"Failed to connect to primary database ({e}). Falling back to local SQLite.")
    db_url = "sqlite:///./krishi_saathi.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields an independent database session per request
    and safely closes it when the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Creates all tables in the database if they do not already exist,
    and runs initial data seeding.
    """
    # Import all models here so that Base metadata registers every entity
    import models  # noqa: F401
    from database.seed_data import seed_default_data

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified and created successfully.")

    # Seed initial verified agricultural knowledge
    db = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()
