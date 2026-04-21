import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Home, FileText, BarChart3, Settings, Menu, X, Calendar } from 'lucide-react';
import { useAuthStore, useCurrentUser, useIsOperator } from '../hooks/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useCompany } from '../contexts/CompanyContext';
import { Sidebar } from '../components/Sidebar';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useCurrentUser();
  const isOperator = useIsOperator();
  const { isDark, toggle } = useThemeStore();
  const { companyName } = useCompany();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Оператор
  if (isOperator) {
    const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
    const textColor = isDark ? '#e0e0e0' : '#111827';
    const borderColor = isDark ? '#333' : '#e5e7eb';
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: `1px solid ${borderColor}`, backgroundColor: isDark ? '#1e1e1e' : 'white' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{companyName}</h1>
          <button onClick={logout} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Выйти</button>
        </div>
        <main><Outlet /></main>
      </div>
    );
  }

  // Навигационные пункты для обычных пользователей (без "Пользователи")
  const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: Home },
    { name: 'Управление заявками', href: '/tickets/new', icon: FileText },
    { name: 'Отчеты', href: '/reports', icon: BarChart3 },
    { name: 'Настройки', href: '/settings', icon: Settings },
	{ name: 'Дежурства', href: '/duty-schedule', icon: Calendar }, // импортировать Calendar из lucide-react
  ];

  const bgColor = isDark ? '#1e1e1e' : '#f9fafb';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const borderColor = isDark ? '#333' : '#e5e7eb';

  if (!isDesktop) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
        <div style={{ padding: '12px 16px', backgroundColor: isDark ? '#1e1e1e' : 'white', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={24} color={textColor} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: textColor }}>{companyName}</h1>
          <div style={{ width: 24 }} />
        </div>
        {mobileMenuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileMenuOpen(false)} />
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '220px', backgroundColor: isDark ? '#1e1e1e' : 'white', boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={textColor} /></button>
              </div>
              <Sidebar navigation={navigation} user={user} logout={logout} isDark={isDark} toggle={toggle} companyName={companyName} />
            </div>
          </div>
        )}
        <main style={{ padding: '16px' }}><Outlet /></main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: bgColor }}>
      <Sidebar navigation={navigation} user={user} logout={logout} isDark={isDark} toggle={toggle} companyName={companyName} />
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;