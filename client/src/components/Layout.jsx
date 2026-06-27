import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  BarChart3,
  LogOut,
  Workflow
} from 'lucide-react';

export default function Layout({ children, currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', name: 'Business Profile', icon: User },
    { id: 'generator', name: 'AI Generator', icon: Sparkles },
    { id: 'bot', name: 'Sales Bot / Leads', icon: MessageSquare },
    { id: 'calendar', name: 'Content Calendar', icon: Calendar }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
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
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Workflow style={{ color: 'var(--accent-primary)', width: 28, height: 28 }} />
          <span style={{ 
            fontFamily: 'var(--font-heading)', 
            fontWeight: 800, 
            fontSize: '1.25rem',
            letterSpacing: '-0.5px'
          }}>
            Social<span style={{ color: 'var(--accent-primary)' }}>Sell AI</span>
          </span>
        </div>

        {/* Menu Navigation */}
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left'
                }}
                className={isActive ? '' : 'nav-hover'}
              >
                <Icon style={{ 
                  width: 20, 
                  height: 20, 
                  color: isActive ? 'var(--accent-primary)' : 'inherit',
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
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-muted)'
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
          <button style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer'
          }}>
            <LogOut style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          background: 'rgba(3, 7, 18, 0.4)',
          backdropFilter: 'blur(8px)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {menuItems.find(m => m.id === currentPage)?.name || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-primary">FlowZint Hackathon 2026</span>
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
          {children}
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
