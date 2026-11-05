"""
Farm Task and Reminder Database Model.
Enables farmers to manage and track agricultural activities.
"""

from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base


class FarmTask(Base):
    __tablename__ = "farm_tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="General")  # Sowing, Irrigation, Fertilizer, Spraying, Harvesting
    due_date = Column(Date, nullable=False, default=date.today)
    priority = Column(String(20), default="Medium")   # Low, Medium, High
    status = Column(String(20), default="Pending")     # Pending, In Progress, Completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    farmer = relationship("Farmer", back_populates="tasks")
