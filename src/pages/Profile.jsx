import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { getPasswordRuleResults, isStrongPassword } from '../utils/passwordValidation';
import { formatDate } from '../utils/formatDate';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  LogOut, 
  Server, 
  Layers, 
  Cpu, 
  Database,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  XCircle,
  KeyRound,
  Save,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const Profile = () => {
  const { user, setUser, logout } = useAuth();

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const passwordRules = getPasswordRuleResults(passwordForm.newPassword);
  const validPasswordRules = passwordRules.filter(rule => rule.valid).length;

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const updatedUser = await authService.updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim()
      });
      setUser(updatedUser);
      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordError('Password must meet all security requirements below.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordSuccess('Password changed successfully! Please use your new password next time you sign in.');

      // Security Notification
      notificationService.createNotification({
        title: 'Your password was changed successfully',
        message: 'Your account credentials were updated. If you did not make this change, please contact support immediately.',
        category: 'SECURITY',
        severity: 'CRITICAL',
        actionUrl: 'profile',
        metadata: { event: 'PASSWORD_CHANGED', timestamp: new Date().toISOString() }
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0F172A' }}>Account & Security Settings</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Manage your personal corporate credentials, security passwords, and microservices ecosystem
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Profile Info & Change Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Profile Card / Personal Details */}
          <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: '700',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}>
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.fullName || user?.username}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-emerald">
                    {user?.role === 'ROLE_ADMIN' ? 'Administrator' : user?.role === 'ROLE_USER' ? 'Corporate User' : (user?.role || 'Member')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>@{user?.username}</span>
                </div>
              </div>
            </div>

            {profileError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} color="#10B981" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="e.g. Johnathan Doe"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} color="#4F46E5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="e.g. user@fintrack.corp"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Joined on {formatDate(user?.createdAt || new Date())}
                </span>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <Save size={15} />
                  <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* CHANGE PASSWORD CARD */}
          <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>Change Password</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Requires your current password for identity verification
                </p>
              </div>
            </div>

            {passwordError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Current Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter current password"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">New Password * (Strong password required)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter strong new password"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: '-0.4rem',
                marginBottom: '1.25rem',
                padding: '0.75rem 0.85rem',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Password requirements</span>
                  <span style={{ fontSize: '0.7rem', color: validPasswordRules === passwordRules.length ? '#047857' : '#64748B', fontWeight: '600' }}>
                    {validPasswordRules}/{passwordRules.length} met
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '0.3rem' }}>
                  {passwordRules.map(rule => (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: rule.valid ? '#047857' : '#64748B' }}>
                      {rule.valid ? <CheckCircle2 size={13} color="#10B981" /> : <XCircle size={13} color="#CBD5E1" />}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Re-enter new password"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.875rem',
                    background: '#4F46E5',
                    borderColor: '#4F46E5'
                  }}
                >
                  <Lock size={15} />
                  <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Microservices Architecture & Session Termination */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Microservices Card */}
          <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Server size={20} color="#0F172A" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A' }}>Microservices Ecosystem</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Spring Boot cloud cluster status</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {[
                { name: 'Eureka Service Discovery', port: '9000', icon: Cpu, color: '#10B981' },
                { name: 'API Gateway (Edge Router)', port: '8080', icon: Layers, color: '#4F46E5' },
                { name: 'Auth Service (JWT Engine)', port: '8081', icon: Shield, color: '#10B981' },
                { name: 'Category Service (Budget Engine)', port: '8082', icon: Database, color: '#10B981' },
                { name: 'Expense Service (Ledger Engine)', port: '8083', icon: Database, color: '#059669' },
                { name: 'Report Service (Analytics Engine)', port: '8084', icon: Cpu, color: '#4F46E5' }
              ].map((service, idx) => {
                const IconComponent = service.icon;
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <IconComponent size={15} color={service.color} />
                      <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{service.name}</strong>
                    </div>
                    <span style={{ color: '#64748B', fontWeight: '700', fontSize: '0.78rem', background: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      Port {service.port}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Control Card */}
          <div className="card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Session Management
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Terminate your authenticated JWT session across browser windows securely.
            </p>

            <button 
              onClick={logout} 
              className="btn btn-secondary" 
              style={{
                width: '100%',
                color: '#DC2626',
                borderColor: '#FECACA',
                background: '#FEF2F2',
                fontWeight: '600',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out of Account</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
