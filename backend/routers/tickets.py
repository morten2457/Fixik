"""
Роутер для управления заявками.
Обрабатывает создание, просмотр, обновление заявок, загрузку фото.
"""

import os
import uuid
from datetime import datetime
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import aiofiles
import json

from database import get_session, get_ticket_by_id, get_tickets_for_user, get_executors, get_ticket_stats
from models import (
    Ticket, TicketCreate, TicketUpdate, TicketPublic, TicketStatus, 
    User, UserRole, DashboardData, TicketStats, WSMessage
)
from routers.auth import get_current_active_user, check_admin_role
from pydantic import BaseModel

class BulkStatusUpdate(BaseModel):
    ticket_ids: List[int]
    status: TicketStatus

class MergeTickets(BaseModel):
    ticket_ids: List[int]
    title: str

# ===== КОНФИГУРАЦИЯ =====

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

# Настройки загрузки файлов
MEDIA_DIR = "media"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Создаем директорию для медиа файлов
os.makedirs(MEDIA_DIR, exist_ok=True)

# ===== WEBSOCKET МЕНЕДЖЕР =====

class ConnectionManager:
    """Менеджер WebSocket соединений для realtime уведомлений"""
    
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}  # user_id -> websocket
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"📡 Пользователь {user_id} подключился к WebSocket")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"📡 Пользователь {user_id} отключился от WebSocket")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message, default=str))
            except Exception as e:
                print(f"❌ Ошибка отправки сообщения пользователю {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict, exclude_user_id: Optional[int] = None):
        for user_id, connection in list(self.active_connections.items()):
            if exclude_user_id and user_id == exclude_user_id:
                continue
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                print(f"❌ Ошибка рассылки пользователю {user_id}: {e}")
                self.disconnect(user_id)

manager = ConnectionManager()


# ===== УТИЛИТЫ =====

def validate_file(file: UploadFile) -> bool:
    if not file.filename:
        return False
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    return True


async def save_uploaded_file(file: UploadFile, prefix: str = "") -> str:
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Недопустимый тип файла")
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{prefix}{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(MEDIA_DIR, unique_filename)
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Файл слишком большой")
        await f.write(content)
    return file_path


async def notify_ticket_update(ticket: Ticket, action: str, session: AsyncSession):
    full_ticket = await get_ticket_by_id(session, ticket.id)
    if not full_ticket:
        return
    message = {
        "type": "ticket_updated",
        "action": action,
        "ticket": {
            "id": full_ticket.id,
            "title": full_ticket.title,
            "status": full_ticket.status,
            "customer_name": full_ticket.customer.full_name if full_ticket.customer else None,
            "executor_name": full_ticket.executor.full_name if full_ticket.executor else None
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    recipients = []
    if full_ticket.customer_id:
        recipients.append(full_ticket.customer_id)
    if full_ticket.executor_id:
        recipients.append(full_ticket.executor_id)
    for user_id in recipients:
        await manager.send_personal_message(message, user_id)
    await manager.broadcast(message)


# ===== WEBSOCKET ЭНДПОИНТЫ =====

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id)


# ===== ОСНОВНЫЕ ЭНДПОИНТЫ =====

@router.post("/", response_model=TicketPublic)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав для создания заявок")
    
    # Плановые даты: start_time обязательно, end_time опционально
    start_time = ticket_data.start_time if ticket_data.start_time else datetime.utcnow()
    end_time = ticket_data.end_time
    
    if ticket_data.executor_id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только администраторы могут назначать исполнителей")
        executor = await session.get(User, ticket_data.executor_id)
        if not executor or executor.role != UserRole.EXECUTOR:
            raise HTTPException(status_code=400, detail="Указанный исполнитель не найден")
    
    ticket = Ticket(
        title=ticket_data.title,
        address=ticket_data.address,
        description=ticket_data.description,
        start_time=start_time,
        end_time=end_time,
        priority=ticket_data.priority,
        system=ticket_data.system,
        customer_id=current_user.id,
        executor_id=ticket_data.executor_id,
        status=TicketStatus.IN_PROGRESS if ticket_data.executor_id else TicketStatus.PENDING,
        started_at=datetime.utcnow() if ticket_data.executor_id else None
    )
    
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    
    full_ticket = await get_ticket_by_id(session, ticket.id)
    await notify_ticket_update(ticket, "created", session)
    return full_ticket


@router.get("/", response_model=List[TicketPublic])
async def get_tickets(
    current_user: Annotated[User, Depends(get_current_active_user)],
    status: Optional[TicketStatus] = None,
    executor_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session)
):
    tickets = await get_tickets_for_user(session, current_user.id, current_user.role)
    if status:
        tickets = [t for t in tickets if t.status == status]
    if executor_id:
        tickets = [t for t in tickets if t.executor_id == executor_id]
    tickets = tickets[offset:offset + limit]
    return tickets


@router.get("/{ticket_id}", response_model=TicketPublic)
async def get_ticket(
    ticket_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_session)
):
    ticket = await get_ticket_by_id(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")
    elif current_user.role == UserRole.EXECUTOR and ticket.executor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")
    return ticket


@router.put("/{ticket_id}", response_model=TicketPublic)
async def update_ticket(
    ticket_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    status: Optional[TicketStatus] = Form(None),
    executor_id: Optional[int] = Form(None),
    completion_comment: Optional[str] = Form(None),
    rejection_reason: Optional[str] = Form(None),
    before_photo: Optional[UploadFile] = File(None),
    after_photo: Optional[UploadFile] = File(None),
    session: AsyncSession = Depends(get_session)
):
    ticket = await get_ticket_by_id(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    can_edit = False
    if current_user.role == UserRole.ADMIN:
        can_edit = True
    elif current_user.role == UserRole.EXECUTOR and ticket.executor_id == current_user.id:
        can_edit = True
    elif current_user.role == UserRole.CUSTOMER and ticket.customer_id == current_user.id:
        can_edit = ticket.status == TicketStatus.PENDING
    
    if not can_edit:
        raise HTTPException(status_code=403, detail="Нет прав на редактирование этой заявки")
    
    updates_made = []
    
    if status is not None:
        old_status = ticket.status
        ticket.status = status
        if status == TicketStatus.IN_PROGRESS and old_status == TicketStatus.PENDING:
            ticket.started_at = datetime.utcnow()
        elif status == TicketStatus.DONE:
            ticket.completed_at = datetime.utcnow()
            if completion_comment:
                ticket.completion_comment = completion_comment
        elif status == TicketStatus.REJECTED:
            if not rejection_reason:
                raise HTTPException(status_code=400, detail="Для отклонения заявки необходимо указать причину")
            ticket.rejection_reason = rejection_reason
        updates_made.append(f"статус изменен с {old_status} на {status}")
    
    if executor_id is not None and current_user.role == UserRole.ADMIN:
        ticket.executor_id = executor_id
        if executor_id and ticket.status == TicketStatus.PENDING:
            ticket.status = TicketStatus.IN_PROGRESS
            ticket.started_at = datetime.utcnow()
        updates_made.append("назначен исполнитель")
    
    if completion_comment is not None and status != TicketStatus.DONE:
        ticket.completion_comment = completion_comment
        updates_made.append("добавлен комментарий")
    
    if rejection_reason is not None:
        ticket.rejection_reason = rejection_reason
        updates_made.append("указана причина отклонения")
    
    if before_photo and before_photo.filename:
        file_path = await save_uploaded_file(before_photo, "before_")
        ticket.before_photo_path = file_path
        updates_made.append("загружено фото 'до'")
    
    if after_photo and after_photo.filename:
        file_path = await save_uploaded_file(after_photo, "after_")
        ticket.after_photo_path = file_path
        updates_made.append("загружено фото 'после'")
    
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    
    updated_ticket = await get_ticket_by_id(session, ticket_id)
    action = "status_changed" if status else "updated"
    await notify_ticket_update(ticket, action, session)
    return updated_ticket


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    current_user: Annotated[User, Depends(check_admin_role)],
    session: AsyncSession = Depends(get_session)
):
    ticket = await get_ticket_by_id(session, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    for photo_path in [ticket.before_photo_path, ticket.after_photo_path]:
        if photo_path and os.path.exists(photo_path):
            try:
                os.remove(photo_path)
            except Exception as e:
                print(f"Ошибка удаления файла {photo_path}: {e}")
    
    await session.delete(ticket)
    await session.commit()
    return {"message": "Заявка удалена"}


# ===== ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ =====

@router.patch("/bulk-status")
async def bulk_update_status(
    data: BulkStatusUpdate,
    current_user: Annotated[User, Depends(check_admin_role)],
    session: AsyncSession = Depends(get_session)
):
    tickets = await session.exec(select(Ticket).where(Ticket.id.in_(data.ticket_ids)))
    updated = 0
    for ticket in tickets:
        ticket.status = data.status
        session.add(ticket)
        updated += 1
    await session.commit()
    return {"message": f"Статус {data.status.value} применён к {updated} заявкам"}


@router.post("/merge", response_model=TicketPublic)
async def merge_tickets(
    data: MergeTickets,
    current_user: Annotated[User, Depends(check_admin_role)],
    session: AsyncSession = Depends(get_session)
):
    if len(data.ticket_ids) < 2:
        raise HTTPException(status_code=400, detail="Для объединения нужно минимум две заявки")
    
    first_ticket = await session.get(Ticket, data.ticket_ids[0])
    if not first_ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    new_ticket = Ticket(
        title=data.title,
        address=first_ticket.address,
        description="Объединённая заявка",
        start_time=first_ticket.start_time,
        end_time=first_ticket.end_time,
        priority=first_ticket.priority,
        system=first_ticket.system,
        customer_id=first_ticket.customer_id,
        executor_id=first_ticket.executor_id,
        status=TicketStatus.PENDING
    )
    
    session.add(new_ticket)
    await session.commit()
    await session.refresh(new_ticket)
    
    for tid in data.ticket_ids:
        ticket = await session.get(Ticket, tid)
        if ticket:
            await session.delete(ticket)
    
    await session.commit()
    return new_ticket


@router.get("/executors/list", response_model=List[dict])
async def get_executors_list(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_session)
):
    executors = await get_executors(session)
    return [
        {"id": executor.id, "full_name": executor.full_name, "email": executor.email}
        for executor in executors
    ]


@router.get("/media/{filename}")
async def get_media_file(filename: str):
    file_path = os.path.join(MEDIA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path)


@router.get("/dashboard/data", response_model=DashboardData)
async def get_dashboard_data(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_session)
):
    stats_data = await get_ticket_stats(session)
    stats = TicketStats(**stats_data)
    all_tickets = await get_tickets_for_user(session, current_user.id, current_user.role)
    recent_tickets = all_tickets[:10]
    
    my_tickets = None
    if current_user.role in [UserRole.EXECUTOR, UserRole.CUSTOMER]:
        my_tickets = [t for t in all_tickets if 
                     (current_user.role == UserRole.EXECUTOR and t.executor_id == current_user.id) or
                     (current_user.role == UserRole.CUSTOMER and t.customer_id == current_user.id)][:5]
    
    return DashboardData(
        stats=stats,
        recent_tickets=recent_tickets,
        my_tickets=my_tickets
    )