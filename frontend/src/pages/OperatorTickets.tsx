import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Ticket, dutiesAPI } from '../api/client';
import { TicketTable } from '../components/TicketTable';
import toast from 'react-hot-toast';

const OperatorTickets = () => {
  const { isDark } = useThemeStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [dutyData, setDutyData] = useState<{ city: string; employees: { name: string; phone: string }[] }[]>([]);

  const fetchTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/tickets/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data: Ticket[] = await response.json();
      
      const now = new Date();
      const filtered = data.filter(t => {
        if (t.status === 'done') return false;
        if (t.start_time && new Date(t.start_time) > now) return false;
        if (t.end_time && new Date(t.end_time) < now) return false;
        return true;
      });
      
      setTickets(filtered);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDuties = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const duties = await dutiesAPI.getByDate(today);
      const grouped = duties.reduce((acc, duty) => {
        const city = duty.city;
        if (!acc[city]) acc[city] = [];
        acc[city].push({ name: duty.employee_name, phone: duty.employee_phone });
        return acc;
      }, {} as Record<string, { name: string; phone: string }[]>);
      setDutyData(Object.entries(grouped).map(([city, employees]) => ({ city, employees })));
      setShowDutyModal(true);
    } catch (err) {
      toast.error('Не удалось загрузить дежурных');
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Загрузка заявок...</div>
      </div>
    );
  }

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', width: '100%' }}>
      <div style={{ padding: '24px 15px 16px 15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: textColor, margin: 0 }}>
            Панель дежурного оператора
          </h2>
          <button
            onClick={fetchDuties}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Дежурные техники
          </button>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: isDark ? '#1e1e1e' : 'white', width: '100%' }}>
        <TicketTable
          tickets={tickets}
          showDescription={true}
          showDeadline={false}
          showActions={false}
          isDark={isDark}
          textColor={textColor}
          borderColor={borderColor}
        />
      </div>

      {showDutyModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: isDark ? '#2d2d2d' : 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ color: textColor, marginBottom: '16px' }}>Дежурные техники на сегодня</h3>
            {dutyData.length === 0 ? (
              <p style={{ color: textColor }}>Нет дежурных</p>
            ) : (
              dutyData.map(city => (
                <div key={city.city} style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: textColor, fontWeight: 'bold' }}>{city.city}</h4>
                  {city.employees.map(emp => (
                    <div key={emp.name} style={{ marginLeft: '16px', marginBottom: '8px', color: textColor }}>
                      {emp.name} – {emp.phone}
                    </div>
                  ))}
                </div>
              ))
            )}
            <button
              onClick={() => setShowDutyModal(false)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorTickets;