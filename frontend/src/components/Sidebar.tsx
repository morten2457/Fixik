import { Sun, Moon, LogOut } from 'lucide-react';

interface SidebarProps {
  navigation: any[];
  user: any;
  logout: () => void;
  isDark: boolean;
  toggle: () => void;
  companyName: string;
}

export const Sidebar = ({ navigation, user, logout, isDark, toggle, companyName }: SidebarProps) => {
  const borderColor = isDark ? '#333' : '#e5e7eb';
  const bgColor = isDark ? '#1e1e1e' : 'white';
  const textColor = isDark ? '#e0e0e0' : '#111827';
  const secondaryTextColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div style={{ width: '220px', flexShrink: 0, backgroundColor: bgColor, borderRight: `1px solid ${borderColor}`, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: `1px solid ${borderColor}` }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: textColor }}>{companyName}</h1>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem' }}>
        {navigation.map((item: any) => (
          <a
            key={item.name}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.25rem',
              borderRadius: '0.375rem',
              color: textColor,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <item.icon size={18} style={{ marginRight: '0.75rem' }} />
            {item.name}
          </a>
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${borderColor}`, padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: secondaryTextColor }}>Тема</span>
          <button onClick={toggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {isDark ? <Sun size={16} color={textColor} /> : <Moon size={16} color="#374151" />}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>{user?.full_name?.charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ marginLeft: '0.5rem', flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: textColor }}>{user?.full_name}</p>
            <p style={{ fontSize: '0.7rem', color: secondaryTextColor, textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: secondaryTextColor }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};