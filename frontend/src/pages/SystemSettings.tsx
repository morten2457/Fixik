import { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useSystems } from '../contexts/SystemsContext';
import { System } from '../api/client';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const SystemSettings = () => {
  const { isDark } = useThemeStore();
  const { systems, addSystem, updateSystem, deleteSystem } = useSystems();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<System | null>(null);
  const [newSystem, setNewSystem] = useState({ name: '', text_color: '#6399F6', bg_color: '#283142', border_color: '#6399F6' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (system: System) => {
    setEditingId(system.id);
    setEditForm({ ...system });
  };

  const handleSaveEdit = () => {
    if (editForm) {
      updateSystem(editForm.id, {
        name: editForm.name,
        text_color: editForm.text_color,
        bg_color: editForm.bg_color,
        border_color: editForm.border_color,
      });
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

	const handleAdd = () => {
	  if (newSystem.name.trim()) {
		addSystem({
		  name: newSystem.name,
		  text_color: newSystem.text_color,
		  bg_color: newSystem.bg_color,
		  border_color: newSystem.border_color,
		  is_default: false,   // добавляем обязательное поле
		});
		setNewSystem({ name: '', text_color: '#6399F6', bg_color: '#283142', border_color: '#6399F6' });
		setShowAddForm(false);
	  }
	};

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const cardBg = isDark ? '#2d2d2d' : 'white';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';
  const inputBg = isDark ? '#1e1e1e' : 'white';
  const inputTextColor = isDark ? '#e0e0e0' : '#111827';
  const buttonPrimary = isDark ? '#3b82f6' : '#2563eb';
  const buttonDanger = isDark ? '#dc2626' : '#ef4444';
  const buttonSuccess = isDark ? '#16a34a' : '#22c55e';

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: textColor }}>Настройка систем</h1>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: buttonPrimary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} /> Добавить систему
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: textColor, marginBottom: '16px' }}>Новая система</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Название</label>
              <input
                type="text"
                placeholder="Название системы"
                value={newSystem.name}
                onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: inputBg,
                  color: inputTextColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Цвет текста</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={newSystem.text_color}
                  onChange={(e) => setNewSystem({ ...newSystem, text_color: e.target.value })}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }}
                />
                <span style={{ fontSize: '14px', color: textColor }}>{newSystem.text_color}</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Цвет фона</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={newSystem.bg_color}
                  onChange={(e) => setNewSystem({ ...newSystem, bg_color: e.target.value })}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }}
                />
                <span style={{ fontSize: '14px', color: textColor }}>{newSystem.bg_color}</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Цвет рамки</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={newSystem.border_color}
                  onChange={(e) => setNewSystem({ ...newSystem, border_color: e.target.value })}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }}
                />
                <span style={{ fontSize: '14px', color: textColor }}>{newSystem.border_color}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: textColor, border: `1px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
            <button onClick={handleAdd} style={{ padding: '8px 16px', backgroundColor: buttonSuccess, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Добавить</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: isDark ? '#2d2d2d' : '#f9fafb' }}>
            <tr>
              <th style={{ padding: '16px 12px', textAlign: 'left', color: textColor, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${borderColor}` }}>Название</th>
              <th style={{ padding: '16px 12px', textAlign: 'left', color: textColor, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${borderColor}` }}>Цвет текста</th>
              <th style={{ padding: '16px 12px', textAlign: 'left', color: textColor, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${borderColor}` }}>Фон</th>
              <th style={{ padding: '16px 12px', textAlign: 'left', color: textColor, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${borderColor}` }}>Рамка</th>
              <th style={{ padding: '16px 12px', textAlign: 'center', color: textColor, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${borderColor}` }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => (
              <tr key={system.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                {editingId === system.id ? (
                  <>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        value={editForm?.name || ''}
                        onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', backgroundColor: inputBg, color: inputTextColor, border: `1px solid ${borderColor}`, borderRadius: '8px', fontSize: '14px' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={editForm?.text_color || '#000000'} onChange={(e) => setEditForm({ ...editForm!, text_color: e.target.value })} style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={editForm?.bg_color || '#ffffff'} onChange={(e) => setEditForm({ ...editForm!, bg_color: e.target.value })} style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={editForm?.border_color || '#000000'} onChange={(e) => setEditForm({ ...editForm!, border_color: e.target.value })} style={{ width: '48px', height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`, cursor: 'pointer', backgroundColor: inputBg }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: buttonSuccess, marginRight: '8px' }} title="Сохранить"><Save size={18} /></button>
                      <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: buttonDanger }} title="Отмена"><X size={18} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '12px', color: textColor }}>{system.name}</td>
                    <td style={{ padding: '12px' }}><div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: system.text_color, border: `1px solid ${borderColor}` }} /></td>
                    <td style={{ padding: '12px' }}><div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: system.bg_color, border: `1px solid ${borderColor}` }} /></td>
                    <td style={{ padding: '12px' }}><div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: system.border_color, border: `1px solid ${borderColor}` }} /></td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => handleEdit(system)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: buttonPrimary, marginRight: '8px' }} title="Редактировать"><Edit2 size={18} /></button>
                      <button onClick={() => deleteSystem(system.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: buttonDanger }} title="Удалить"><Trash2 size={18} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemSettings;