import { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES_STORAGE_KEY = 'duty_cities';

const DutySchedule = () => {
  const { isDark } = useThemeStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cities, setCities] = useState<string[]>(() => {
    const stored = localStorage.getItem(CITIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [duties, setDuties] = useState<any[]>([]);
  // Убираем неиспользуемые loading и setLoading
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '' });
  const [permanentMode, setPermanentMode] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const storedDuties = localStorage.getItem('duties');
    if (storedDuties) setDuties(JSON.parse(storedDuties));
  }, []);

  useEffect(() => {
    localStorage.setItem('duties', JSON.stringify(duties));
  }, [duties]);

  const addCity = () => {
    if (!newCityName.trim()) {
      toast.error('Введите название города');
      return;
    }
    if (cities.includes(newCityName.trim())) {
      toast.error('Город уже существует');
      return;
    }
    setCities([...cities, newCityName.trim()]);
    setNewCityName('');
    setShowAddCity(false);
    toast.success('Город добавлен');
  };

  const deleteCity = (city: string) => {
    if (!window.confirm(`Удалить город "${city}" и все дежурства в нём?`)) return;
    setCities(cities.filter(c => c !== city));
    setDuties(duties.filter(d => d.city !== city));
    toast.success('Город удалён');
  };

  const getCityEmployees = (city: string) => {
    const employeesMap = new Map();
    duties.filter(d => d.city === city).forEach(d => {
      if (!employeesMap.has(d.employee_name)) {
        employeesMap.set(d.employee_name, { name: d.employee_name, phone: d.employee_phone });
      }
    });
    return Array.from(employeesMap.values());
  };

  const isOnDuty = (city: string, employeeName: string, dateStr: string) => {
    return duties.some(d => d.city === city && d.employee_name === employeeName && d.date === dateStr);
  };

  const toggleDuty = (city: string, employeeName: string, employeePhone: string, dateStr: string) => {
    const existing = duties.find(d => d.city === city && d.employee_name === employeeName && d.date === dateStr);
    if (existing) {
      setDuties(duties.filter(d => d !== existing));
      toast.success('Дежурство снято');
    } else {
      setDuties([...duties, { city, employee_name: employeeName, employee_phone: employeePhone, date: dateStr }]);
      toast.success('Дежурство добавлено');
    }
  };

  const addEmployee = (city: string) => {
    if (!newEmployee.name.trim() || !newEmployee.phone.trim()) {
      toast.error('Введите ФИО и телефон');
      return;
    }
    if (permanentMode) {
      const newDuties = daysArray.map(day => ({
        city,
        employee_name: newEmployee.name,
        employee_phone: newEmployee.phone,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      }));
      setDuties([...duties, ...newDuties]);
      toast.success(`Сотрудник добавлен со всеми дежурствами на месяц`);
    } else {
      // toast.info заменён на toast (обычное уведомление)
      toast('Сотрудник добавлен. Отметьте дни вручную.');
    }
    setNewEmployee({ name: '', phone: '' });
    setEditingCity(null);
    setPermanentMode(false);
  };

  const deleteEmployee = (city: string, employeeName: string) => {
    if (!window.confirm(`Удалить сотрудника ${employeeName} и все его дежурства?`)) return;
    setDuties(duties.filter(d => !(d.city === city && d.employee_name === employeeName)));
    toast.success('Сотрудник удалён');
  };

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const cardBg = isDark ? '#2d2d2d' : 'white';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';
  const headerBg = isDark ? '#2d2d2d' : '#f9fafb';
  const evenRowBg = isDark ? '#1e1e1e' : 'white';
  const oddRowBg = isDark ? '#2a2a2a' : '#f9fafb';
  const buttonPrimary = isDark ? '#3b82f6' : '#2563eb';
  const buttonDanger = isDark ? '#dc2626' : '#ef4444';
  const buttonSuccess = isDark ? '#16a34a' : '#22c55e';

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: textColor }}>
          График дежурств технического персонала
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}
          >
            ◀
          </button>
          <span style={{ fontSize: '18px', fontWeight: 500, color: textColor }}>
            {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}
          >
            ▶
          </button>
          <button
            onClick={() => setShowAddCity(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: buttonPrimary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Добавить город
          </button>
        </div>
      </div>

      {showAddCity && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: cardBg,
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Название города"
            value={newCityName}
            onChange={e => setNewCityName(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              backgroundColor: isDark ? '#1e1e1e' : 'white',
              color: textColor,
            }}
          />
          <button
            onClick={addCity}
            style={{
              padding: '6px 12px',
              backgroundColor: buttonSuccess,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Сохранить
          </button>
          <button
            onClick={() => {
              setShowAddCity(false);
              setNewCityName('');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: buttonDanger,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>
      )}

      {cities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: textColor }}>
          Нет городов. Добавьте первый.
        </div>
      )}

      {cities.map(city => {
        const employees = getCityEmployees(city);
        return (
          <div
            key={city}
            style={{
              marginBottom: '40px',
              backgroundColor: cardBg,
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px',
                backgroundColor: headerBg,
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <div className="flex justify-between items-center">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: textColor }}>{city}</h2>
                <div>
                  <button
                    onClick={() => deleteCity(city)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: buttonDanger,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    Удалить город
                  </button>
                  <button
                    onClick={() => setEditingCity(city)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: buttonPrimary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={16} /> Добавить сотрудника
                  </button>
                </div>
              </div>
              {editingCity === city && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: isDark ? '#1e1e1e' : 'white',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="ФИО"
                      value={newEmployee.name}
                      onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      style={{
                        flex: 2,
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? '#1e1e1e' : 'white',
                        color: textColor,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Телефон"
                      value={newEmployee.phone}
                      onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? '#1e1e1e' : 'white',
                        color: textColor,
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: textColor }}>
                      <input
                        type="checkbox"
                        checked={permanentMode}
                        onChange={e => setPermanentMode(e.target.checked)}
                      />
                      Постоянное дежурство
                    </label>
                    <button
                      onClick={() => addEmployee(city)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: buttonSuccess,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Добавить
                    </button>
                    <button
                      onClick={() => {
                        setEditingCity(null);
                        setNewEmployee({ name: '', phone: '' });
                        setPermanentMode(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: buttonDanger,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        backgroundColor: headerBg,
                        color: textColor,
                        borderBottom: `1px solid ${borderColor}`,
                        minWidth: '180px',
                      }}
                    >
                      Сотрудник
                    </th>
                    {daysArray.map(day => (
                      <th
                        key={day}
                        style={{
                          padding: '12px 4px',
                          textAlign: 'center',
                          backgroundColor: headerBg,
                          color: textColor,
                          borderBottom: `1px solid ${borderColor}`,
                          minWidth: '40px',
                        }}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={daysArray.length + 1}
                        style={{ padding: '40px', textAlign: 'center', color: textColor }}
                      >
                        Нет сотрудников. Добавьте первого.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, idx) => (
                      <tr
                        key={emp.name}
                        style={{ backgroundColor: idx % 2 === 0 ? evenRowBg : oddRowBg }}
                      >
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          <div>
                            <div style={{ fontWeight: 500, color: textColor }}>{emp.name}</div>
                            <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#6b7280' }}>
                              {emp.phone}
                            </div>
                            <button
                              onClick={() => deleteEmployee(city, emp.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: buttonDanger,
                                marginTop: '4px',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        {daysArray.map(day => {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const onDuty = isOnDuty(city, emp.name, dateStr);
                          return (
                            <td
                              key={day}
                              onClick={() => toggleDuty(city, emp.name, emp.phone, dateStr)}
                              style={{
                                padding: '8px 4px',
                                textAlign: 'center',
                                borderBottom: `1px solid ${borderColor}`,
                                backgroundColor: onDuty ? buttonSuccess : 'transparent',
                                cursor: 'pointer',
                              }}
                            >
                              {onDuty && <Check size={16} style={{ color: 'white' }} />}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DutySchedule;