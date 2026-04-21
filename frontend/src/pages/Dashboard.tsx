import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useThemeStore } from '../store/themeStore';
import { ticketsAPI, reportsAPI, Ticket, TicketStatus } from '../api/client';
import { useCurrentUser } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { TicketTable } from '../components/TicketTable';
import { TicketLegend } from '../components/TicketLegend';
import { BulkActions } from '../components/BulkActions';
import { useTicketFilters } from '../hooks/useTicketFilters';
import { useSystems } from '../contexts/SystemsContext';

type TabId = 'info' | 'planned' | 'active' | 'completed';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'Информация по заявкам', icon: <FileText size={20} /> },
  { id: 'planned', label: 'Запланированные заявки', icon: <Clock size={20} /> },
  { id: 'active', label: 'В работе', icon: <Clock size={20} /> },
  { id: 'completed', label: 'Выполнено', icon: <CheckCircle size={20} /> },
];

const Dashboard = () => {
  const { isDark } = useThemeStore();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [mergeTitle, setMergeTitle] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const { systems } = useSystems();

  const { data: tickets = [], isLoading, error } = useQuery<Ticket[]>(
    'dashboard-tickets',
    () => ticketsAPI.getAll()
  );

  const { active, planned, inProgress, completed } = useTicketFilters(tickets);

  const bulkStatusMutation = useMutation<void, Error, { ids: number[]; status: TicketStatus }>(
    ({ ids, status }) => ticketsAPI.bulkUpdateStatus(ids, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dashboard-tickets');
        toast.success('Статусы обновлены');
        setSelectedIds([]);
      },
      onError: (error: Error) => {
        toast.error('Ошибка при обновлении статусов');
        console.error(error);
      },
    }
  );

  const mergeMutation = useMutation<Ticket, Error, { ids: number[]; title: string }>(
    ({ ids, title }) => ticketsAPI.mergeTickets(ids, title),
    {
      onSuccess: (newTicket) => {
        queryClient.invalidateQueries('dashboard-tickets');
        toast.success(`Создана родительская заявка #${newTicket.id}`);
        setShowMergeModal(false);
        setMergeTitle('');
        setSelectedIds([]);
      },
      onError: (error: Error) => {
        toast.error('Ошибка при объединении заявок');
        console.error(error);
      },
    }
  );

  const completeMutation = useMutation<Ticket, Error, number>(
    (ticketId: number) => {
      const formData = new FormData();
      formData.append('status', 'done');
      return ticketsAPI.update(ticketId, formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dashboard-tickets');
        toast.success('Заявка выполнена');
      },
      onError: (error: Error) => {
        toast.error('Ошибка при выполнении заявки');
        console.error(error);
      },
    }
  );

  const handleBulkStatus = (status: TicketStatus) => {
    if (selectedIds.length === 0) {
      toast.error('Выберите хотя бы одну заявку');
      return;
    }
    bulkStatusMutation.mutate({ ids: selectedIds, status });
  };

  const handleMerge = () => {
    if (selectedIds.length < 2) {
      toast.error('Выберите минимум две заявки для объединения');
      return;
    }
    setShowMergeModal(true);
  };

  const confirmMerge = () => {
    if (!mergeTitle.trim()) {
      toast.error('Введите название родительской заявки');
      return;
    }
    mergeMutation.mutate({ ids: selectedIds, title: mergeTitle });
  };

  const handleDownloadReport = async () => {
    setIsReportLoading(true);
    try {
      const blob = await reportsAPI.getExecutedReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executed_tickets_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Отчет сформирован');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при формировании отчета');
    } finally {
      setIsReportLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === active.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(active.map(t => t.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const themeStyles = {
    bgColor: isDark ? '#1e1e1e' : '#f9fafb',
    textColor: isDark ? '#e0e0e0' : '#111827',
    borderColor: isDark ? '#444' : '#e5e7eb',
    tabBg: isDark ? '#2d2d2d' : 'white',
    activeTabBg: isDark ? '#3d3d3d' : '#f0f0f0',
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: themeStyles.bgColor,
        minHeight: '100%',
        padding: '24px',
        width: '100%',
        color: themeStyles.textColor,
      }}
    >
      <h1 className="text-2xl font-bold mb-6" style={{ color: themeStyles.textColor }}>
        Добро пожаловать, {user?.full_name}!
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: `1px solid ${themeStyles.borderColor}`,
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: activeTab === tab.id ? themeStyles.activeTabBg : themeStyles.tabBg,
              border: `1px solid ${themeStyles.borderColor}`,
              borderBottom: activeTab === tab.id ? 'none' : `1px solid ${themeStyles.borderColor}`,
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              color: themeStyles.textColor,
              fontSize: '1.25rem',
              fontWeight: 500,
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div>
          <BulkActions
            selectedCount={selectedIds.length}
            totalCount={active.length}
            onSelectAll={toggleSelectAll}
            onBulkStatus={handleBulkStatus}
            onMerge={handleMerge}
            isDark={isDark}
            borderColor={themeStyles.borderColor}
            textColor={themeStyles.textColor}
            isLoading={bulkStatusMutation.isLoading || mergeMutation.isLoading}
          />
          <TicketLegend systems={systems} textColor={themeStyles.textColor} />
          <TicketTable
            tickets={active}
            showDescription
            isDark={isDark}
            textColor={themeStyles.textColor}
            borderColor={themeStyles.borderColor}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            onComplete={(id) => completeMutation.mutate(id)}
          />
        </div>
      )}

      {activeTab === 'planned' && (
        <TicketTable
          tickets={planned}
          showDeadline
          isDark={isDark}
          textColor={themeStyles.textColor}
          borderColor={themeStyles.borderColor}
          onComplete={(id) => completeMutation.mutate(id)}
        />
      )}

      {activeTab === 'active' && (
        <TicketTable
          tickets={inProgress}
          isDark={isDark}
          textColor={themeStyles.textColor}
          borderColor={themeStyles.borderColor}
          onComplete={(id) => completeMutation.mutate(id)}
        />
      )}

      {activeTab === 'completed' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={handleDownloadReport}
              disabled={isReportLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isReportLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isReportLoading ? 0.7 : 1,
              }}
            >
              <FileText size={16} />
              {isReportLoading ? 'Формирование...' : 'Сформировать отчет'}
            </button>
          </div>
          <TicketTable
            tickets={completed}
            isDark={isDark}
            textColor={themeStyles.textColor}
            borderColor={themeStyles.borderColor}
          />
        </div>
      )}

      {showMergeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? '#2d2d2d' : 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ color: themeStyles.textColor, marginBottom: '16px' }}>Объединение заявок</h3>
            <p style={{ color: themeStyles.textColor, marginBottom: '8px' }}>
              Введите название для новой родительской заявки:
            </p>
            <input
              type="text"
              value={mergeTitle}
              onChange={(e) => setMergeTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                border: `1px solid ${themeStyles.borderColor}`,
                borderRadius: '4px',
                backgroundColor: isDark ? '#1e1e1e' : 'white',
                color: themeStyles.textColor,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowMergeModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={confirmMerge}
                disabled={mergeMutation.isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {mergeMutation.isLoading ? 'Объединение...' : 'Объединить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;