from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from pydantic import BaseModel
from database import get_session
from models import Duty
from routers.auth import get_current_active_user

router = APIRouter(prefix="/api/duties", tags=["duties"])

class DutyCreate(BaseModel):
    city: str
    employee_name: str
    employee_phone: str
    date: str

class DutyResponse(DutyCreate):
    id: int

@router.get("/", response_model=List[DutyResponse])
async def get_duties(
    date: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    query = select(Duty)
    if date:
        query = query.where(Duty.date == date)
    result = await session.exec(query)
    return result.all()

@router.post("/", response_model=DutyResponse, status_code=status.HTTP_201_CREATED)
async def create_duty(
    duty: DutyCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    db_duty = Duty(**duty.dict())
    session.add(db_duty)
    await session.commit()
    await session.refresh(db_duty)
    return db_duty

@router.delete("/{duty_id}")
async def delete_duty(
    duty_id: int,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    duty = await session.get(Duty, duty_id)
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    await session.delete(duty)
    await session.commit()
    return {"message": "Deleted"}