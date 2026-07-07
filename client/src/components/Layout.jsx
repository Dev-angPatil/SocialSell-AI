import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  UploadCloud, 
  FileText, 
  MessageSquare, 
  Calendar, 
  BarChart3,
  LogOut,
  Workflow
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/intake', name: 'Intake Hub', icon: UploadCloud },
    { path: '/queue', name: 'Review Queue', icon: FileText },
    { path: '/profile', name: 'Business Profile', icon: User },
    { path: '/bot', name: 'Sales Bot / Leads', icon: MessageSquare },
    { path: '/calendar', name: 'Content Calendar', icon: Calendar }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'rgba(3, 7, 18, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--hairline-strong)'
        }}>
          <Workflow style={{ color: 'var(--primary)', width: 28, height: 28 }} />
          <span style={{ 
            fontFamily: 'var(--font-sans)', 
            fontWeight: 800, 
            fontSize: '1.25rem',
            letterSpacing: '-0.5px',
            color: '#ffffff'
          }}>
            Social<span style={{ color: 'var(--primary)' }}>Sell AI</span>
          </span>
        </div>

        {/* Menu Navigation */}
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--ink)' : 'var(--on-dark-mute)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left'
                }}
                className={isActive ? '' : 'nav-hover'}
              >
                <Icon style={{ 
                  width: 20, 
                  height: 20, 
                  color: isActive ? 'var(--ink)' : 'inherit',
                  transition: 'color var(--transition-fast)'
                }} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer info / Log out */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--hairline-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--on-dark-mute)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--success)'
            }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Live Syncing</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        background: 'var(--canvas)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          background: 'rgba(3, 7, 18, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
            {menuItems.find(m => m.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-primary">FlowZint Hackathon 2026</span>
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .nav-hover:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
}
