from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from database import get_session
from models import Employee
from routers.auth import get_current_active_user

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.get("/")
async def get_employees(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    result = await session.exec(select(Employee))
    return result.all()

@router.post("/")
async def create_employee(
    employee: Employee,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    session.add(employee)
    await session.commit()
    await session.refresh(employee)
    return employee