async def auto_complete_expired_tickets():
    async with async_session_maker() as session:
        now = datetime.utcnow()
        expired = await session.exec(
            select(Ticket).where(
                Ticket.end_time < now,
                Ticket.status != TicketStatus.DONE
            )
        )
        for t in expired:
            t.status = TicketStatus.DONE
            t.completed_at = now
            session.add(t)
        await session.commit()