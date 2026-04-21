import { Ticket } from '../api/client';

export const useTicketFilters = (tickets: Ticket[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = tickets.filter(
    (t: Ticket) => t.status !== 'done' && t.status !== 'rejected'
  );
  const planned = tickets.filter(
    (t: Ticket) =>
      t.status === 'pending' && t.end_time && new Date(t.end_time) > today
  );
  const inProgress = tickets.filter((t: Ticket) => {
    const endTime = t.end_time ? new Date(t.end_time) : null;
    return (
      t.status === 'in_progress' ||
      (t.status === 'pending' && endTime && endTime < today)
    );
  });
  const completed = tickets.filter(
    (t: Ticket) => t.status === 'done' || t.status === 'rejected'
  );

  return { active, planned, inProgress, completed };
};