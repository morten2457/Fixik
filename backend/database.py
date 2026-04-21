"""
Конфигурация и управление базой данных SQLite.
Использует SQLModel + SQLAlchemy для асинхронного доступа к данным.
"""

import os
from typing import AsyncGenerator
from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
import asyncio
from models import TicketStatus  # импорт из моделей (для get_tickets_for_user)

# ===== КОНФИГУРАЦИЯ БД =====

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/tickets.db")
ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

# Создание движков БД
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)

# Фабрика сессий
async_session_maker = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


# ===== ИНИЦИАЛИЗАЦИЯ БД =====

def create_db_and_tables():
    """
    Создает все таблицы в базе данных.
    Используется при первом запуске приложения.
    """
    from models import User, Ticket, System, Employee  # добавлен Employee
    SQLModel.metadata.create_all(engine)
    print("✅ База данных и таблицы созданы")


async def init_db():
    """
    Асинхронная инициализация базы данных.
    Создает таблицы если их нет, а также добавляет дефолтные системы.
    """
    from models import User, Ticket, System, Employee  # добавлен Employee
    
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Добавляем дефолтные системы, если таблица пуста
    async with async_session_maker() as session:
        result = await session.exec(select(System))
        existing = result.first()
        if not existing:
            default_systems = [
                System(name="Си норд", text_color="#6399F6", bg_color="#283142", border_color="#6399F6", is_default=True),
                System(name="АИР", text_color="#DC7B2B", bg_color="#E9AE71", border_color="#DC7B2B", is_default=True),
                System(name="Георитм", text_color="#71A342", bg_color="#415649", border_color="#71A342", is_default=True),
                System(name="Струна", text_color="#F44637", bg_color="#57383C", border_color="#F44637", is_default=True),
            ]
            for sys in default_systems:
                session.add(sys)
            await session.commit()
            print("✅ Дефолтные системы созданы")
    
    print("✅ Асинхронная инициализация БД завершена")


# ===== СЕССИИ БД =====

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Генератор асинхронных сессий для работы с БД.
    Используется как dependency в FastAPI эндпоинтах.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_session() -> Session:
    """
    Синхронная сессия для использования в планировщике задач и seed.py
    """
    return Session(engine)


# ===== УТИЛИТЫ БД =====

async def get_user_by_email(session: AsyncSession, email: str):
    """Получить пользователя по email"""
    from models import User
    result = await session.exec(select(User).where(User.email == email))
    return result.first()


async def get_user_by_id(session: AsyncSession, user_id: int):
    """Получить пользователя по ID"""
    from models import User
    result = await session.exec(select(User).where(User.id == user_id))
    return result.first()


async def get_ticket_by_id(session: AsyncSession, ticket_id: int):
    """Получить заявку по ID с включением связанных данных"""
    from models import Ticket, User
    from sqlalchemy.orm import selectinload
    
    query = select(Ticket).options(
        selectinload(Ticket.customer),
        selectinload(Ticket.executor)
    ).where(Ticket.id == ticket_id)
    
    result = await session.exec(query)
    return result.first()


async def get_tickets_for_user(session: AsyncSession, user_id: int, role: str):
    from models import Ticket, User, UserRole
    from sqlalchemy.orm import selectinload

    query = select(Ticket).options(
        selectinload(Ticket.customer),
        selectinload(Ticket.executor)
    )

    if role == UserRole.CUSTOMER:
        query = query.where(Ticket.customer_id == user_id)
    elif role == UserRole.EXECUTOR:
        query = query.where(Ticket.executor_id == user_id)
    elif role == UserRole.OPERATOR:
        # Оператор видит все заявки, кроме выполненных
        query = query.where(Ticket.status != TicketStatus.DONE)
    # ADMIN видит всё

    result = await session.exec(query.order_by(Ticket.created_at.desc()))
    return result.all()


async def get_executors(session: AsyncSession):
    """Получить список всех исполнителей"""
    from models import User, UserRole
    result = await session.exec(
        select(User).where(
            User.role == UserRole.EXECUTOR,
            User.is_active == True
        )
    )
    return result.all()


# ===== СТАТИСТИКА =====

async def get_ticket_stats(session: AsyncSession):
    """Получить статистику по заявкам"""
    from models import Ticket, TicketStatus
    from sqlalchemy import func, select as sql_select
    
    # Подсчет по статусам
    total_query = select(func.count(Ticket.id))
    pending_query = select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.PENDING)
    in_progress_query = select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.IN_PROGRESS)
    done_query = select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.DONE)
    rejected_query = select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.REJECTED)
    
    total = (await session.exec(total_query)).first() or 0
    pending = (await session.exec(pending_query)).first() or 0
    in_progress = (await session.exec(in_progress_query)).first() or 0
    done = (await session.exec(done_query)).first() or 0
    rejected = (await session.exec(rejected_query)).first() or 0
    
    # Среднее время выполнения (в часах)
    avg_time = None
    if done > 0:
        avg_query = select(
            func.avg(
                func.julianday(Ticket.completed_at) - func.julianday(Ticket.started_at)
            ) * 24
        ).where(
            Ticket.status == TicketStatus.DONE,
            Ticket.started_at.isnot(None),
            Ticket.completed_at.isnot(None)
        )
        avg_time = (await session.exec(avg_query)).first()
    
    return {
        "total_tickets": total,
        "pending_tickets": pending, 
        "in_progress_tickets": in_progress,
        "done_tickets": done,
        "rejected_tickets": rejected,
        "avg_completion_time_hours": round(avg_time, 2) if avg_time else None
    }


# ===== ОЧИСТКА ДАННЫХ =====

async def cleanup_old_tickets(days: int = 90):
    """
    Удаляет заявки и связанные файлы старше указанного количества дней.
    Используется в планировщике задач.
    """
    from datetime import datetime, timedelta
    from models import Ticket
    import os
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    async with async_session_maker() as session:
        old_tickets_query = select(Ticket).where(Ticket.created_at < cutoff_date)
        result = await session.exec(old_tickets_query)
        old_tickets = result.all()
        
        deleted_count = 0
        for ticket in old_tickets:
            for photo_path in [ticket.before_photo_path, ticket.after_photo_path]:
                if photo_path and os.path.exists(photo_path):
                    try:
                        os.remove(photo_path)
                        print(f"🗑️ Удален файл: {photo_path}")
                    except Exception as e:
                        print(f"❌ Ошибка удаления файла {photo_path}: {e}")
            await session.delete(ticket)
            deleted_count += 1
        
        await session.commit()
        print(f"🧹 Очистка завершена: удалено {deleted_count} заявок старше {days} дней")
        return deleted_count


# ===== ТЕСТОВОЕ ПОДКЛЮЧЕНИЕ =====

async def test_connection():
    """Тестирует подключение к базе данных"""
    try:
        async with async_session_maker() as session:
            result = await session.exec(select(1))
            assert result.first() == 1
            print("✅ Подключение к БД успешно")
            return True
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(test_connection())