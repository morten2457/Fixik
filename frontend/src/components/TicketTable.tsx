import React from 'react';
import { Ticket } from '../api/client';
import { useTimezone } from '../contexts/TimezoneContext';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { Trash2, CheckCircle, Wrench, Hourglass, Circle, XCircle } from 'lucide-react';
import { useSystems } from '../contexts/SystemsContext';

interface TicketTableProps {
  tickets: Ticket[];
  showDescription?: boolean;
  showDeadline?: boolean;
  showActions?: boolean;
  isDark: boolean;
  textColor: string;
  borderColor: string;
  onDelete?: (ticketId: number, ticketTitle: string) => void;
  onComplete?: (ticketId: number) => void;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onSelectAll?: () => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  showDescription = false,
  showDeadline = false,
  showActions = false,
  isDark,
  textColor,
  borderColor,
  onDelete,
  onComplete,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}) => {
  const { timezone } = useTimezone();
  const { getSystemColorMap } = useSystems();
  const systemColorMap = getSystemColorMap();
  const headerBg = isDark ? '#2d2d2d' : '#f9fafb';
  const rowEvenBg = isDark ? '#1e1e1e' : 'white';
  const rowOddBg = isDark ? '#2a2a2a' : '#f9fafb';
  const hasCheckboxes = !!onToggleSelect && !!onSelectAll;

  const getStatusIcon = (status: string) => {
    const iconStyle = { width: 20, height: 20 };
    switch (status) {
      case 'done':
        return <CheckCircle style={{ ...iconStyle, color: '#10b981' }} />;
      case 'in_progress':
        return <Wrench style={{ ...iconStyle, color: '#3b82f6' }} />;
      case 'waiting':
        return <Hourglass style={{ ...iconStyle, color: '#f59e0b' }} />;
      case 'pending':
        return <Circle style={{ ...iconStyle, color: '#9ca3af' }} />;
      case 'rejected':
        return <XCircle style={{ ...iconStyle, color: '#ef4444' }} />;
      default:
        return <Circle style={{ ...iconStyle, color: '#9ca3af' }} />;
    }
  };

  const renderDateTimeCell = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const formatted = formatDateTime(dateStr, timezone);
    if (formatted === '-') return '-';
    
    const parts = formatted.split(', ');
    if (parts.length === 2) {
      return (
        <>
          <div>{parts[1]}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{parts[0]}</div>
        </>
      );
    }
    return formatted;
  };

  if (tickets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: textColor }}>
        Нет заявок для отображения
      </div>
    );
  }

  const tableWrapperStyle: React.CSSProperties = {
    width: '100%',
    overflowX: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 6px',
    textAlign: 'left',
    fontSize: '0.7rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: textColor,
    borderBottom: `1px solid ${borderColor}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 6px',
    color: textColor,
    borderBottom: `1px solid ${borderColor}`,
  };

  const tdCenterStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'center',
  };

  return (
    <div style={tableWrapperStyle}>
      <table style={tableStyle}>
        <thead style={{ backgroundColor: headerBg }}>
          <tr>
            {hasCheckboxes && (
              <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === tickets.length}
                  onChange={onSelectAll}
                />
              </th>
            )}
            <th style={thStyle}>Номер объекта</th>
            <th style={thStyle}>Адрес</th>
            <th style={thStyle}>Исполнитель</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Статус</th>
            {showDescription && <th style={thStyle}>Описание</th>}
            {showDeadline && <th style={thStyle}>Дата выполнения</th>}
            <th style={{ ...thStyle, textAlign: 'center' }}>Начало</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Завершение</th>
            {showActions && <th style={{ ...thStyle, textAlign: 'center' }}>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, index) => {
            const isCompleted = ticket.status === 'done';
            return (
              <tr key={ticket.id} style={{ backgroundColor: index % 2 === 0 ? rowEvenBg : rowOddBg }}>
                {hasCheckboxes && (
                  <td style={{ ...tdCenterStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ticket.id)}
                      onChange={() => onToggleSelect(ticket.id)}
                    />
                  </td>
                )}
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: systemColorMap[ticket.system || '']?.bgColor || (isDark ? '#2d2d2d' : '#f3f4f6'),
                      color: systemColorMap[ticket.system || '']?.textColor || textColor,
                      border: `1px solid ${systemColorMap[ticket.system || '']?.borderColor || borderColor}`,
                    }}
                  >
                    {ticket.title}
                  </span>
                </td>
                <td style={{ ...tdStyle, wordBreak: 'break-word' }}>{ticket.address}</td>
                <td style={tdStyle}>
                  {ticket.executor_name || 'Не назначен'}
                  {ticket.executor_phone && <div style={{ fontSize: '0.7rem' }}>{ticket.executor_phone}</div>}
                </td>
                <td style={tdCenterStyle}>{getStatusIcon(ticket.status)}</td>
                {showDescription && (
                  <td style={{ ...tdStyle, wordBreak: 'break-word' }}>{ticket.description}</td>
                )}
                {showDeadline && (
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {ticket.end_time ? formatDate(ticket.end_time, timezone) : '-'}
                  </td>
                )}
                <td style={tdCenterStyle}>
                  {renderDateTimeCell(ticket.created_at)}
                </td>
                <td style={tdCenterStyle}>
                  {ticket.status === 'done'
                    ? renderDateTimeCell(ticket.completed_at)
                    : renderDateTimeCell(ticket.end_time)}
                </td>
                {showActions && (
                  <td style={tdCenterStyle}>
                    {!isCompleted && (
                      <button
                        onClick={() => onComplete && onComplete(ticket.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#10b981',
                          marginRight: '8px',
                        }}
                        title="Выполнить"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(ticket.id, ticket.title)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};