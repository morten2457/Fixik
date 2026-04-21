from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List
from pydantic import BaseModel
from database import get_session
from models import System
from routers.auth import check_admin_role

router = APIRouter(prefix="/api/systems", tags=["systems"])

# ===== МОДЕЛИ ДЛЯ ЗАПРОСОВ =====

class SystemCreate(BaseModel):
    name: str
    text_color: str
    bg_color: str
    border_color: str

class SystemUpdate(BaseModel):
    name: str | None = None
    text_color: str | None = None
    bg_color: str | None = None
    border_color: str | None = None

# ===== WEBSOCKET МЕНЕДЖЕР =====

class SystemsConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

systems_manager = SystemsConnectionManager()

@router.websocket("/ws")
async def systems_websocket(websocket: WebSocket):
    await systems_manager.connect(websocket)
    try:
        while True:
            # Ожидаем сообщения (например, ping для поддержания соединения)
            await websocket.receive_text()
    except WebSocketDisconnect:
        systems_manager.disconnect(websocket)

# ===== ЭНДПОИНТЫ CRUD =====

@router.get("/", response_model=List[System])
async def get_systems(session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(System))
    return result.all()

@router.post("/", response_model=System)
async def create_system(
    system: SystemCreate,
    current_user=Depends(check_admin_role),
    session: AsyncSession = Depends(get_session)
):
    db_system = System(**system.dict())
    session.add(db_system)
    await session.commit()
    await session.refresh(db_system)
    # Уведомляем всех клиентов об изменении
    await systems_manager.broadcast({"type": "systems_changed"})
    return db_system

@router.put("/{system_id}", response_model=System)
async def update_system(
    system_id: int,
    system_update: SystemUpdate,
    current_user=Depends(check_admin_role),
    session: AsyncSession = Depends(get_session)
):
    db_system = await session.get(System, system_id)
    if not db_system:
        raise HTTPException(status_code=404, detail="System not found")
    for key, value in system_update.dict(exclude_unset=True).items():
        setattr(db_system, key, value)
    session.add(db_system)
    await session.commit()
    await session.refresh(db_system)
    await systems_manager.broadcast({"type": "systems_changed"})
    return db_system

@router.delete("/{system_id}")
async def delete_system(
    system_id: int,
    current_user=Depends(check_admin_role),
    session: AsyncSession = Depends(get_session)
):
    db_system = await session.get(System, system_id)
    if not db_system:
        raise HTTPException(status_code=404, detail="System not found")
    await session.delete(db_system)
    await session.commit()
    await systems_manager.broadcast({"type": "systems_changed"})
    return {"message": "System deleted"}