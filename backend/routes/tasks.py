"""
Farm Tasks and Reminders Routes.
Enables farmers to manage calendar activities (Spraying, Sowing, Irrigation, Fertilizer).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.session import get_db
from models.farmer import Farmer
from models.task import FarmTask
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from utils.dependencies import get_current_farmer

router = APIRouter(prefix="/tasks", tags=["Farm Tasks & Reminders"])


@router.get("", response_model=List[TaskResponse])
def get_farmer_tasks(
    status_filter: Optional[str] = Query(None, description="Pending, In Progress, Completed"),
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Lists farming tasks belonging to the authenticated farmer."""
    query = db.query(FarmTask).filter(FarmTask.farmer_id == current_farmer.id)
    if status_filter:
        query = query.filter(FarmTask.status.ilike(status_filter))
    return query.order_by(FarmTask.due_date.asc()).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_farmer_task(
    payload: TaskCreate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Creates a new farming task reminder."""
    task = FarmTask(
        farmer_id=current_farmer.id,
        farm_id=payload.farm_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        due_date=payload.due_date,
        priority=payload.priority,
        status="Pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_farmer_task(
    task_id: int,
    payload: TaskUpdate,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Updates a farming task (e.g. mark as Completed)."""
    task = db.query(FarmTask).filter(
        FarmTask.id == task_id,
        FarmTask.farmer_id == current_farmer.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access."
        )

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.category is not None:
        task.category = payload.category
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.status is not None:
        task.status = payload.status

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farmer_task(
    task_id: int,
    current_farmer: Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Deletes a farming task."""
    task = db.query(FarmTask).filter(
        FarmTask.id == task_id,
        FarmTask.farmer_id == current_farmer.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access."
        )

    db.delete(task)
    db.commit()
    return None
