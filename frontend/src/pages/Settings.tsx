import { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useTimezone } from '../contexts/TimezoneContext';
import { useCompany } from '../contexts/CompanyContext';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { isDark } = useThemeStore();
  const { timezone, setTimezone } = useTimezone();
  const { companyName, setCompanyName } = useCompany();
  const [selectedTz, setSelectedTz] = useState(timezone);
  const [localName, setLocalName] = useState(companyName);

  const timezones = [
    'Europe/Moscow',
    'Europe/Kaliningrad',
    'Europe/Samara',
    'Asia/Yekaterinburg',
    'Asia/Omsk',
    'Asia/Krasnoyarsk',
    'Asia/Irkutsk',
    'Asia/Yakutsk',
    'Asia/Vladivostok',
    'Asia/Magadan',
    'Asia/Kamchatka',
    'UTC',
    'America/New_York',
    'Europe/London',
  ];

  const handleSaveTimezone = () => {
    setTimezone(selectedTz);
    alert('Часовой пояс сохранён');
  };

  const handleSaveName = () => {
    setCompanyName(localName);
    alert('Название компании сохранено');
  };

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', padding: '24px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: textColor }}>Настройки</h1>
      
      {/* Настройка часового пояса */}
      <div className="card" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <div className="card-content">
          <label className="form-label">Часовой пояс</label>
          <select
            value={selectedTz}
            onChange={(e) => setSelectedTz(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              backgroundColor: isDark ? '#2d2d2d' : 'white',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <button
            onClick={handleSaveTimezone}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Настройка названия компании */}
      <div className="card" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <div className="card-content">
          <label className="form-label">Название компании</label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              backgroundColor: isDark ? '#2d2d2d' : 'white',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleSaveName}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить название
          </button>
        </div>
      </div>
	  
	  {/* Ссылка на управление пользователями */}
	  <div className="card" style={{ maxWidth: '400px', marginBottom: '24px' }}>
		<div className="card-content">
			<Link to="/settings/users" className="text-blue-500 hover:underline">
			Управление пользователями
			</Link>
		</div>
	  </div>

      {/* Ссылка на управление системами */}
      <div className="card" style={{ maxWidth: '400px' }}>
        <div className="card-content">
          <Link
            to="/settings/systems"
            className="text-blue-500 hover:underline"
          >
            Управление системами
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Settings;