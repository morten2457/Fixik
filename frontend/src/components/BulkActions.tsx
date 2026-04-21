import React from 'react';
import { Play, Pause, CheckSquare, Merge } from 'lucide-react';
import { TicketStatus } from '../api/client';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkStatus: (status: TicketStatus) => void;
  onMerge: () => void;
  isDark: boolean;
  borderColor: string;
  textColor: string;
  isLoading: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkStatus,
  onMerge,
  isDark,
  borderColor,
  textColor,
  isLoading,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSelectAll}
          style={{
            padding: '6px 12px',
            backgroundColor: isDark ? '#2d2d2d' : 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            cursor: 'pointer',
            color: textColor,
            fontSize: '14px',
          }}
        >
          {selectedCount === totalCount ? 'Снять выделение' : 'Выбрать все'}
        </button>
        <button
          onClick={() => onBulkStatus('in_progress')}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Play size={16} /> В работе
        </button>
        <button
          onClick={() => onBulkStatus('waiting')}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Pause size={16} /> Ждем согласования
        </button>
        <button
          onClick={() => onBulkStatus('done')}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckSquare size={16} /> Выполнено
        </button>
        <button
          onClick={onMerge}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Merge size={16} /> Объединить
        </button>
      </div>
      <span style={{ color: textColor, fontSize: '14px' }}>
        Выбрано: {selectedCount}
      </span>
    </div>
  );
};