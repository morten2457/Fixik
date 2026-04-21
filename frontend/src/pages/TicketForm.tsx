import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { ticketsAPI } from '../api/client';
import { useCurrentUser } from '../hooks/useAuth';
import { useThemeStore } from '../store/themeStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ticket } from '../api/client';
import { TicketTable } from '../components/TicketTable';
import { TicketLegend } from '../components/TicketLegend';
import { useSystems } from '../contexts/SystemsContext';

interface TicketFormData {
  title: string;
  address: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  executor_name?: string;
  executor_phone?: string;
  system?: string;
}

const TicketForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useCurrentUser();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const { systems } = useSystems();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<TicketFormData>();

  const { data: ticket, isLoading: ticketLoading } = useQuery(
    ['ticket', id],
    () => ticketsAPI.getById(Number(id)),
    { enabled: !!id }
  );

  const createMutation = useMutation(ticketsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('tickets');
      toast.success('Заявка создана');
      reset();
    },
    onError: () => {
      toast.error('Ошибка при создании заявки');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: FormData }) => ticketsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tickets');
        toast.success('Заявка обновлена');
      },
      onError: () => {
        toast.error('Ошибка при обновлении заявки');
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
        queryClient.invalidateQueries('tickets');
        toast.success('Заявка выполнена');
      },
      onError: (error: Error) => {
        toast.error('Ошибка при выполнении заявки');
        console.error(error);
      },
    }
  );

  // Заполнение формы при редактировании
  useEffect(() => {
    if (ticket && isEdit) {
      setValue('title', ticket.title);
      setValue('address', ticket.address);
      setValue('description', ticket.description || '');
      setValue('executor_name', ticket.executor_name || '');
      setValue('executor_phone', ticket.executor_phone || '');
      setValue('system', ticket.system || '');
      setValue('start_time', ticket.start_time ? ticket.start_time.slice(0, 16) : '');
      setValue('end_time', ticket.end_time ? ticket.end_time.slice(0, 16) : '');
    }
  }, [ticket, isEdit, setValue]);

  const onSubmit = async (data: TicketFormData) => {
    try {
      if (isEdit && ticket) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (key === 'start_time' || key === 'end_time') {
              if (value) {
                const isoValue = new Date(value).toISOString();
                formData.append(key, isoValue);
              }
            } else {
              formData.append(key, String(value));
            }
          }
        });
        await updateMutation.mutateAsync({ id: ticket.id, data: formData });
      } else {
        const start_time = data.start_time ? new Date(data.start_time).toISOString() : undefined;
        const end_time = data.end_time ? new Date(data.end_time).toISOString() : undefined;
        await createMutation.mutateAsync({
          title: data.title,
          address: data.address,
          description: data.description || '',
          start_time,
          end_time,
          priority: 1,
          executor_name: data.executor_name,
          executor_phone: data.executor_phone,
          system: data.system,
        });
      }
    } catch (error) {
      // ошибка уже обработана в мутациях
    }
  };

  if (ticketLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const { isDark } = useThemeStore();
  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';

  const { data: tickets = [] } = useQuery<Ticket[]>(
    'tickets',
    () => ticketsAPI.getAll(),
    { refetchInterval: 5000 }
  );

  const activeTickets = tickets.filter(t => t.status !== 'done' && t.status !== 'rejected');

  const handleDelete = async (ticketId: number, ticketTitle: string) => {
    if (window.confirm(`Удалить заявку "${ticketTitle}"?`)) {
      try {
        await ticketsAPI.delete(ticketId);
        queryClient.invalidateQueries('tickets');
        toast.success('Заявка удалена');
      } catch (err) {
        toast.error('Ошибка при удалении заявки');
      }
    }
  };

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', padding: '24px', width: '100%' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: textColor }}>
          {isEdit ? 'Редактировать заявку' : 'Создать заявку'}
        </h1>
      </div>

      <div className="card mb-8" style={{ backgroundColor: isDark ? '#2d2d2d' : 'white' }}>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('title', { required: 'Номер обязателен' })}
                  type="text"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Номер объекта"
                />
                {errors.title && <p style={{ margin: '2px 0 0', color: '#ef4444', fontSize: '12px' }}>{errors.title.message}</p>}
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <select
                  {...register('system')}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                >
                  <option value="">-- Выберите систему --</option>
                  {systems.map((sys) => (
                    <option key={sys.id} value={sys.name}>{sys.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('address', { required: 'Адрес обязателен' })}
                  type="text"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Адрес объекта"
                />
                {errors.address && <p style={{ margin: '2px 0 0', color: '#ef4444', fontSize: '12px' }}>{errors.address.message}</p>}
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('start_time')}
                  type="datetime-local"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Дата и время начала"
                />
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('end_time')}
                  type="datetime-local"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Дата и время окончания"
                />
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('executor_name')}
                  type="text"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Исполнитель"
                />
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input
                  {...register('executor_phone')}
                  type="text"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    color: textColor,
                  }}
                  placeholder="Телефон исполнителя"
                />
              </div>
            </div>

            <div style={{ width: '100%', marginBottom: '1rem' }}>
              <textarea
                {...register('description')}
                style={{
                  width: '100%',
                  height: '100px',
                  resize: 'none',
                  overflowY: 'auto',
                  padding: '8px',
                  fontSize: '14px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  backgroundColor: isDark ? '#1e1e1e' : 'white',
                  color: textColor,
                }}
                placeholder="Описание работ"
                rows={4}
              />
              {errors.description && <p style={{ margin: '2px 0 0', color: '#ef4444', fontSize: '12px' }}>{errors.description.message}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ backgroundColor: bgColor, borderRadius: '8px', padding: '16px 0' }}>
        <TicketLegend systems={systems} textColor={textColor} />
        <TicketTable
          tickets={activeTickets}
          showDescription
          showActions={user?.role === 'admin'}
          onDelete={handleDelete}
          onComplete={(id) => completeMutation.mutate(id)}
          isDark={isDark}
          textColor={textColor}
          borderColor={borderColor}
        />
      </div>
    </div>
  );
};

export default TicketForm;