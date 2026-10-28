import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  Trash2, 
  CheckCheck, 
  ExternalLink, 
  SlidersHorizontal,
  Wallet,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  Filter,
  Mail,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

export const Navbar = ({ activePage, onAddExpenseClick, onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'BUDGET' | 'TRANSACTION' | 'GOAL' | 'SECURITY'
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(notificationService.getPreferences());
  const [testEmailStatus, setTestEmailStatus] = useState({ loading: false, message: '', error: '' });
  const [engineStatus, setEngineStatus] = useState('CONNECTED'); // 'CONNECTED' | 'SYNCING' | 'ERROR'
  const [lastEventTime, setLastEventTime] = useState(new Date());
  const dropdownRef = useRef(null);

  const reloadNotifications = async () => {
    try {
      const list = await notificationService.getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
      setEngineStatus('CONNECTED');
      setLastEventTime(new Date());
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setEngineStatus('ERROR');
    }
  };

  useEffect(() => {
    reloadNotifications();

    const handleUpdate = () => {
      reloadNotifications();
    };

    const handlePrefsUpdate = () => {
      setPreferences(notificationService.getPreferences());
    };

    window.addEventListener('fintrack_notifications_updated', handleUpdate);
    window.addEventListener('fintrack_notification_prefs_updated', handlePrefsUpdate);
    const interval = setInterval(reloadNotifications, 15000); // Poll every 15s

    return () => {
      window.removeEventListener('fintrack_notifications_updated', handleUpdate);
      window.removeEventListener('fintrack_notification_prefs_updated', handlePrefsUpdate);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setPreferencesOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'UNREAD') return !n.read;
      if (activeFilter === 'ALL') return true;
      return n.category === activeFilter;
    });
  }, [notifications, activeFilter]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setPreferencesOpen(false);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await notificationService.markAllAsRead();
    reloadNotifications();
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    if (window.confirm('Clear all notifications? This cannot be undone.')) {
      await notificationService.clearAll();
      reloadNotifications();
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    await notificationService.dismissNotification(id);
    reloadNotifications();
  };

  const handleToggleRead = async (id, currentReadStatus, e) => {
    e.stopPropagation();
    if (!currentReadStatus) {
      await notificationService.markAsRead(id);
    }
    reloadNotifications();
  };

  const handleItemClick = (notif) => {
    notificationService.markAsRead(notif.id);
    reloadNotifications();
    if (notif.actionUrl && onNavigate) {
      onNavigate(notif.actionUrl);
      setIsOpen(false);
    }
  };

  const handlePrefChange = (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    notificationService.savePreferences(next);
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus({ loading: true, message: '', error: '' });
    try {
      const res = await notificationService.sendTestEmail('Triggered from FinTrack Navbar Diagnostics');
      if (res && res.status === 'DISABLED') {
        setTestEmailStatus({ loading: false, message: 'SMTP is currently disabled in backend (fintrack.mail.enabled=false). Delivery logged.', error: '' });
      } else if (res && res.success) {
        setTestEmailStatus({ loading: false, message: 'Diagnostic test email successfully sent via Gmail SMTP!', error: '' });
      } else {
        setTestEmailStatus({ loading: false, message: '', error: res?.errorMessage || 'Delivery failed. Check SMTP configuration.' });
      }
    } catch (err) {
      setTestEmailStatus({ loading: false, message: '', error: err.message || 'Error triggering test email' });
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'BUDGET': return { label: 'Budget Alert', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
      case 'GOAL': return { label: 'Savings Goal', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'TRANSACTION': return { label: 'Transaction', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'SECURITY': return { label: 'Security', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'INSIGHT': return { label: 'Insight', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
      default: return { label: 'System', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Financial Dashboard';
      case 'transactions': return 'All Transactions';
      case 'income': return 'Income & Salary Tracker';
      case 'expenses': return 'Expense Tracker';
      case 'add-expense': return 'Record New Expense';
      case 'categories': return 'Categories & Budgets';
      case 'analytics': return 'Spending Analytics';
      case 'reports': return 'Financial Reports & Statements';
      case 'goals': return 'Savings Goals';
      case 'profile':
      case 'settings': return 'Account & Security Settings';
      default: return 'FinTrack Overview';
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 2rem',
      background: '#0F172A',
      borderBottom: '1px solid #1E293B',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#FFFFFF', lineHeight: 1.2 }}>
          {getPageTitle()}
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
          Welcome back, <span style={{ color: '#F8FAFC', fontWeight: '600' }}>{user?.fullName || user?.username || 'User'}</span>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Quick Add Expense Action Button */}
        {onAddExpenseClick && activePage !== 'add-expense' && (
          <button 
            className="btn btn-primary"
            onClick={onAddExpenseClick}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.9rem', gap: '0.4rem', height: '38px' }}
          >
            <span>+ Add Expense</span>
          </button>
        )}

        {/* Notifications Icon with Interactive Dropdown Panel */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            onClick={handleToggle}
            title="Notifications & Alerts"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '9px',
              background: isOpen ? '#334155' : '#1E293B',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOpen ? '#FFFFFF' : '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isOpen) {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOpen) {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.borderColor = '#334155';
              }
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '1px 6px',
                borderRadius: '9999px',
                border: '2px solid #0F172A',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Centralized Notification Center */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 10px)',
              width: '410px',
              maxWidth: '92vw',
              background: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              zIndex: 50,
              animation: 'fadeIn 0.15s ease-out'
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '0.9rem 1.15rem',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1E293B'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={17} color="#10B981" />
                  <div>
                    <span style={{ fontWeight: '800', fontSize: '0.925rem', letterSpacing: '-0.01em', display: 'block' }}>
                      Notifications
                    </span>
                    <span style={{ fontSize: '0.72rem', color: unreadCount > 0 ? '#34D399' : '#94A3B8', fontWeight: '600' }}>
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={() => setPreferencesOpen(!preferencesOpen)}
                    title="Notification Preferences"
                    style={{
                      background: preferencesOpen ? '#334155' : 'transparent',
                      border: 'none',
                      color: preferencesOpen ? '#FFFFFF' : '#94A3B8',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <SlidersHorizontal size={14} />
                  </button>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      title="Mark all as read"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                    >
                      <CheckCheck size={13} />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Clear all notifications"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Preferences Subpanel Drawer */}
              {preferencesOpen && (
                <div style={{
                  padding: '1rem',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notification Channels</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>In-App &amp; Gmail SMTP</span>
                  </div>

                  {/* Gmail SMTP Master Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={15} color={preferences.emailNotificationsEnabled !== false ? '#10B981' : '#94A3B8'} />
                      <div>
                        <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.78rem' }}>Gmail Email Notifications</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {preferences.emailNotificationsEnabled !== false ? 'Active via smtp.gmail.com:587' : 'Disabled in preferences'}
                        </div>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotificationsEnabled !== false}
                        onChange={() => handlePrefChange('emailNotificationsEnabled')}
                        style={{ accentColor: '#10B981', transform: 'scale(1.15)', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  {/* Notification Categories */}
                  <div style={{ fontWeight: '600', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                    Subscribed Categories
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { key: 'budgetAlerts', label: 'Budget Alerts' },
                      { key: 'savingsGoals', label: 'Savings Goals' },
                      { key: 'transactions', label: 'Transaction Receipts' },
                      { key: 'financialSummaries', label: 'Monthly Reports' },
                      { key: 'spendingInsights', label: 'Spending Insights' }
                    ].map(pref => (
                      <label key={pref.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={preferences[pref.key] !== false}
                          onChange={() => handlePrefChange(pref.key)}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>{pref.label}</span>
                      </label>
                    ))}
                    <div style={{ color: '#94A3B8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Shield size={11} color="#6366F1" />
                      <span>Security: Always Active</span>
                    </div>
                  </div>

                  {/* Diagnostic Test Email Tool */}
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Diagnostic SMTP Verification</span>
                      <button
                        onClick={handleSendTestEmail}
                        disabled={testEmailStatus.loading}
                        style={{
                          background: testEmailStatus.loading ? '#94A3B8' : '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.32rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          cursor: testEmailStatus.loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <Send size={11} />
                        <span>{testEmailStatus.loading ? 'Sending...' : 'Send Test Email'}</span>
                      </button>
                    </div>
                    {testEmailStatus.message && (
                      <div style={{ color: '#059669', fontSize: '0.72rem', fontWeight: '500', background: '#ECFDF5', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                        ✓ {testEmailStatus.message}
                      </div>
                    )}
                    {testEmailStatus.error && (
                      <div style={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: '500', background: '#FEF2F2', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                        ⚠ {testEmailStatus.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Category Filter Pills */}
              <div style={{
                display: 'flex',
                gap: '0.35rem',
                padding: '0.65rem 0.85rem',
                background: '#F1F5F9',
                borderBottom: '1px solid #E2E8F0',
                overflowX: 'auto',
                scrollbarWidth: 'none'
              }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'UNREAD', label: `Unread (${unreadCount})` },
                  { id: 'BUDGET', label: 'Budget' },
                  { id: 'TRANSACTION', label: 'Transactions' },
                  { id: 'GOAL', label: 'Goals' },
                  { id: 'SECURITY', label: 'Security' }
                ].map(filter => {
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: isActive ? '#0F172A' : '#CBD5E1',
                        background: isActive ? '#0F172A' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#475569',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {/* Notification List Body */}
              <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
                {filteredNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto'
                    }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.25rem' }}>
                      {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications found'}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                      {activeFilter === 'UNREAD'
                        ? 'You are up to date on all budget alerts, goals, and transactions.'
                        : 'New activities, budget breaches, and goal milestones will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filteredNotifications.map((notif) => {
                      const badge = getCategoryBadge(notif.category);
                      const isUnread = !notif.read;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleItemClick(notif)}
                          style={{
                            background: isUnread ? '#F8FAFC' : '#FFFFFF',
                            border: `1px solid ${isUnread ? '#CBD5E1' : '#E2E8F0'}`,
                            borderRadius: '10px',
                            padding: '0.8rem 0.9rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            cursor: notif.actionUrl ? 'pointer' : 'default',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            borderLeft: isUnread ? '3px solid #10B981' : '3px solid transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94A3B8'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = isUnread ? '#CBD5E1' : '#E2E8F0'}
                        >
                          {/* Top Row: Category Badge + Timestamp + Dismiss */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`
                              }}>
                                {badge.label}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                · {formatTimestamp(notif.timestamp)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {/* Read/Unread Toggle */}
                              <button
                                onClick={(e) => handleToggleRead(notif.id, notif.read, e)}
                                title={isUnread ? 'Mark as read' : 'Mark as unread'}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isUnread ? '#10B981' : '#CBD5E1',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: isUnread ? '#10B981' : '#CBD5E1'
                                }} />
                              </button>

                              {/* Dismiss Button */}
                              <button
                                onClick={(e) => handleDismiss(notif.id, e)}
                                title="Dismiss Notification"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94A3B8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: isUnread ? '800' : '700',
                            color: '#0F172A',
                            lineHeight: 1.3
                          }}>
                            {notif.title}
                          </div>

                          {/* Message Body */}
                          <div style={{
                            fontSize: '0.78rem',
                            color: '#475569',
                            lineHeight: 1.4
                          }}>
                            {notif.message}
                          </div>

                          {/* Action Footer if link exists */}
                          {notif.actionUrl && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              marginTop: '0.2rem',
                              fontSize: '0.72rem',
                              color: '#4F46E5',
                              fontWeight: '700'
                            }}>
                              <span>View details</span>
                              <ArrowRight size={11} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dropdown Footer: Live Event Engine Status */}
              <div style={{
                padding: '0.65rem 1rem',
                background: engineStatus === 'ERROR' ? '#FEF2F2' : '#F8FAFC',
                borderTop: `1px solid ${engineStatus === 'ERROR' ? '#FECACA' : '#E2E8F0'}`,
                fontSize: '0.725rem',
                color: engineStatus === 'ERROR' ? '#991B1B' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>
                    {engineStatus === 'CONNECTED' && `Event Service: Last synced ${lastEventTime ? lastEventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'just now'}`}
                    {engineStatus === 'SYNCING' && 'Event Service: Synchronizing events...'}
                    {engineStatus === 'ERROR' && 'Event Service: Processing failed / Disconnected'}
                  </span>
                </div>
                <span style={{ 
                  fontWeight: '700', 
                  color: engineStatus === 'CONNECTED' ? '#10B981' : (engineStatus === 'SYNCING' ? '#F59E0B' : '#EF4444'), 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem' 
                }}>
                  <div style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    background: engineStatus === 'CONNECTED' ? '#10B981' : (engineStatus === 'SYNCING' ? '#F59E0B' : '#EF4444'),
                    boxShadow: engineStatus === 'CONNECTED' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                  }} />
                  {engineStatus === 'CONNECTED' ? 'Engine Active' : (engineStatus === 'SYNCING' ? 'Syncing...' : 'Failed')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
