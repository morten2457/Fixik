import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const formatDateTime = (date: string | Date | null | undefined, timezone: string, formatStr = 'dd.MM.yyyy HH:mm') => {
  console.log('formatDateTime input:', date, timezone); // <-- логирование добавлено сюда

  if (!date) return '-';
  let d = typeof date === 'string' ? new Date(date) : date;
  // Если строка не содержит Z, добавляем её (предполагаем, что это UTC)
  if (typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
    d = new Date(date + 'Z');
  }
  if (isNaN(d.getTime())) return '-';
  const zonedDate = utcToZonedTime(d, timezone);
  return format(zonedDate, formatStr);
};

export const formatDate = (date: string | Date | null | undefined, timezone: string) => {
  return formatDateTime(date, timezone, 'dd.MM.yyyy');
};