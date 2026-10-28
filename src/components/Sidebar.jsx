import React from 'react';
import { 
  LayoutDashboard, 
  History,
  PlusCircle, 
  Receipt,
  Tags, 
  PieChart, 
  FileText,
  Settings, 
  LogOut, 
  CreditCard,
  Wallet,
  Sliders,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();

  const navigationSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'All Transactions', icon: History }
      ]
    },
    {
      title: 'MANAGE MONEY',
      items: [
        { id: 'income', label: 'Income & Salary', icon: Wallet },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
        { id: 'add-expense', label: 'Add Expense', icon: PlusCircle },
        { id: 'categories', label: 'Budget Categories', icon: Tags }
      ]
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { id: 'analytics', label: 'Spending Analytics', icon: PieChart },
        { id: 'reports', label: 'Reports & Statements', icon: FileText },
        { id: 'goals', label: 'Savings Goals', icon: Target }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'settings', label: 'Settings & Profile', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="app-sidebar" style={{
      width: '260px',
      background: '#0F172A',
      borderRight: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem',
      flexShrink: 0,
      color: '#FFFFFF',
      position: 'sticky',
      top: 0,
      height: '100vh',
      minHeight: '100%',
      overflowY: 'auto',
      zIndex: 30,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0.65rem 1.25rem 0.65rem',
        borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          flexShrink: 0
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <div>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: '800',
            letterSpacing: '0.05em',
            color: '#FFFFFF',
            lineHeight: 1.1,
            margin: 0
          }}>
            FIN<span style={{ color: '#10B981' }}>TRACK</span>
          </h2>
          <span style={{
            fontSize: '0.625rem',
            color: '#94A3B8',
            letterSpacing: '0.06em',
            fontWeight: '600',
            display: 'block',
            marginTop: '2px'
          }}>
            Track. Analyze. Save.
          </span>
        </div>
      </div>

      {/* Nav Section Groups */}
      <nav className="app-sidebar-nav" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem',
        flex: 1,
        padding: '0.25rem 0'
      }}>
        {navigationSections.map((section) => (
          <div key={section.title}>
            {/* Section Header */}
            <div style={{
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
              color: '#64748B',
              textTransform: 'uppercase',
              padding: '0 0.65rem',
              marginBottom: '0.4rem'
            }}>
              {section.title}
            </div>

            {/* Section Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    className={`app-nav-item${isActive ? ' active' : ''}`}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      background: isActive 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'transparent',
                      color: isActive 
                        ? '#10B981' 
                        : '#94A3B8',
                      border: 'none',
                      borderLeft: isActive 
                        ? '3px solid #10B981' 
                        : '3px solid transparent',
                      fontSize: '0.86rem',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#F8FAFC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94A3B8';
                      }
                    }}
                  >
                    <Icon size={17} color={isActive ? '#10B981' : 'currentColor'} strokeWidth={isActive ? 2.2 : 1.9} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Profile Card */}
      {user && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '0.85rem',
          borderTop: '1px solid #1E293B'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            padding: '0.65rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
              {/* Online Indicator Status + Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div 
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    color: '#FFFFFF',
                    letterSpacing: '0.02em'
                  }}
                  title={user.fullName || user.username}
                >
                  {(() => {
                    const name = (user.fullName || user.username || '').trim();
                    if (!name) return 'U';
                    const parts = name.split(/\s+/);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                {/* Green Status Pulse Dot */}
                <span 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '2px solid #0F172A'
                  }}
                  title="Online"
                />
              </div>

              {/* Truncated Name & Role */}
              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    fontSize: '0.83rem', 
                    fontWeight: '600', 
                    color: '#F8FAFC', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden', 
                    whiteSpace: 'nowrap',
                    lineHeight: 1.25
                  }}
                  title={user.fullName || user.username}
                >
                  {user.fullName || user.username}
                </div>
                <div style={{ 
                  fontSize: '0.68rem', 
                  color: '#94A3B8', 
                  marginTop: '1px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {user.role === 'ROLE_ADMIN' 
                    ? 'Administrator' 
                    : user.role === 'ROLE_USER' 
                      ? 'Personal Account' 
                      : (user.role || 'Personal Account')}
                </div>
              </div>
            </div>

            {/* Logout Button (⇥) */}
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                e.currentTarget.style.color = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
