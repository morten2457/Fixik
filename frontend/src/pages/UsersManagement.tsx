import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { authAPI } from '../api/client';
import { User, UserRole } from '../api/client';
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from 'lucide-react';

const UsersManagement = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: UserRole.CUSTOMER,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: UserRole.CUSTOMER,
    is_active: true,
    password: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.register({
        email: newUser.email,
        full_name: newUser.full_name,
        password: newUser.password,
        role: newUser.role,
        is_active: true,
      });
      toast.success('Пользователь создан');
      setNewUser({ email: '', full_name: '', password: '', role: UserRole.CUSTOMER });
      fetchUsers();
    } catch (err) {
      toast.error('Ошибка при создании пользователя');
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await authAPI.updateUserRole(userId, newRole);
      toast.success('Роль обновлена');
      fetchUsers();
    } catch (err) {
      toast.error('Не удалось обновить роль');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${userEmail}?`)) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('Пользователь удалён');
      fetchUsers();
    } catch (err) {
      toast.error('Не удалось удалить пользователя');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ full_name: '', email: '', role: UserRole.CUSTOMER, is_active: true, password: '' });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const updateData: any = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      await authAPI.updateUser(editingUser.id, updateData);
      toast.success('Пользователь обновлён');
      closeEditModal();
      fetchUsers();
    } catch (err) {
      toast.error('Ошибка при обновлении пользователя');
    }
  };

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#444' : '#e5e7eb';
  const inputBg = 'white';
  const inputTextColor = '#111827';

  if (loading) return <div className="p-6 text-center" style={{ color: textColor }}>Загрузка...</div>;

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ padding: '24px 24px 16px 24px' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ color: textColor }}>Управление пользователями</h1>

        {/* Форма создания */}
        <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: isDark ? '#2d2d2d' : 'white', border: `1px solid ${borderColor}` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: textColor }}>Создать нового пользователя</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input type="text" placeholder="ФИО" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required
                  style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '14px', border: `1px solid ${borderColor}`, borderRadius: '4px', boxSizing: 'border-box', backgroundColor: inputBg, color: inputTextColor }} />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required
                  style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '14px', border: `1px solid ${borderColor}`, borderRadius: '4px', boxSizing: 'border-box', backgroundColor: inputBg, color: inputTextColor }} />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <input type="password" placeholder="Пароль" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required
                  style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '14px', border: `1px solid ${borderColor}`, borderRadius: '4px', boxSizing: 'border-box', backgroundColor: inputBg, color: inputTextColor }} />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '14px', border: `1px solid ${borderColor}`, borderRadius: '4px', boxSizing: 'border-box', backgroundColor: inputBg, color: inputTextColor }}>
                  <option value={UserRole.CUSTOMER}>Клиент</option>
                  <option value={UserRole.EXECUTOR}>Исполнитель</option>
                  <option value={UserRole.ADMIN}>Администратор</option>
                  <option value={UserRole.OPERATOR}>Оператор</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Создать</button>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="px-6 text-red-500 mb-4">{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: isDark ? '#2d2d2d' : '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Пользователь</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Email</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Пароль</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Роль</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Активен</th>
              <th style={{ padding: '12px 24px', textAlign: 'center', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '16px 24px', textAlign: 'center', color: textColor }}>Нет пользователей</td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} style={{ backgroundColor: index % 2 === 0 ? (isDark ? '#1e1e1e' : 'white') : (isDark ? '#2a2a2a' : '#f9fafb') }}>
                  <td style={{ padding: '12px 24px', color: textColor, borderBottom: `1px solid ${borderColor}` }}>{user.full_name}</td>
                  <td style={{ padding: '12px 24px', color: textColor, borderBottom: `1px solid ${borderColor}` }}>{user.email}</td>
                  <td style={{ padding: '12px 24px', color: textColor, borderBottom: `1px solid ${borderColor}` }}>••••••••</td>
                  <td style={{ padding: '12px 24px', borderBottom: `1px solid ${borderColor}` }}>
                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      style={{ width: '100%', height: '32px', padding: '4px 8px', fontSize: '14px', border: `1px solid ${borderColor}`, borderRadius: '4px', boxSizing: 'border-box', backgroundColor: inputBg, color: inputTextColor }}>
                      <option value={UserRole.CUSTOMER}>Клиент</option>
                      <option value={UserRole.EXECUTOR}>Исполнитель</option>
                      <option value={UserRole.ADMIN}>Администратор</option>
                      <option value={UserRole.OPERATOR}>Оператор</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'center', borderBottom: `1px solid ${borderColor}` }}>
                    <input type="checkbox" checked={user.is_active} onChange={() => handleRoleChange(user.id, user.role)} disabled style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'center', borderBottom: `1px solid ${borderColor}` }}>
                    <button onClick={() => openEditModal(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '8px' }} title="Редактировать"><Edit2 size={18} /></button>
                    <button onClick={() => handleDeleteUser(user.id, user.email)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Удалить"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно редактирования */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: isDark ? '#2d2d2d' : 'white', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ color: textColor, marginBottom: '16px' }}>Редактирование пользователя</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: textColor }}>ФИО</label>
              <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: inputTextColor }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: textColor }}>Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: inputTextColor }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: textColor }}>Новый пароль (оставьте пустым, если не менять)</label>
              <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: inputTextColor }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: textColor }}>Роль</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: inputTextColor }}>
                <option value={UserRole.CUSTOMER}>Клиент</option>
                <option value={UserRole.EXECUTOR}>Исполнитель</option>
                <option value={UserRole.ADMIN}>Администратор</option>
                <option value={UserRole.OPERATOR}>Оператор</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} style={{ cursor: 'pointer' }} />
              <span style={{ color: textColor }}>Активен</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeEditModal} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleUpdateUser} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;