import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutGrid, 
  Mail, 
  Lock, 
  User, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Receipt,
  PieChart,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getPasswordRuleResults, isStrongPassword } from '../utils/passwordValidation';

export const Auth = ({ initialMode = 'login', onSuccess, onNavigateForgotPassword }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [animating, setAnimating] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRules = getPasswordRuleResults(regData.password);

  const validRulesCount = passwordRules.filter(r => r.valid).length;
  const passwordIsStrong = isStrongPassword(regData.password);

  const getStrengthMeta = () => {
    if (regData.password.length === 0) return { label: 'Empty', color: '#94A3B8', width: '0%' };
    if (validRulesCount <= 2) return { label: 'Weak', color: '#DC2626', width: '25%' };
    if (validRulesCount <= 3) return { label: 'Fair', color: '#F59E0B', width: '50%' };
    if (validRulesCount === 4) return { label: 'Good', color: '#3B82F6', width: '75%' };
    return { label: 'Strong', color: '#10B981', width: '100%' };
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setError('');
    setAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      setAnimating(false);
    }, 150);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginUsername, loginPassword);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegChange = (e) => {
    setRegData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordIsStrong) {
      setError('Password does not meet all strong security requirements.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(regData.username, regData.email, regData.password, regData.fullName);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed. Username or email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const strengthMeta = getStrengthMeta();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: '#F1F5F9',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Centered Two-Column Split Container */}
      <div style={{
        maxWidth: '1040px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        transition: 'all 0.3s ease'
      }}>
        
        {/* LEFT COLUMN: Deep Navy Showcase Card */}
        <div style={{
          background: 'linear-gradient(170deg, #090E17 0%, #0F172A 60%, #0D1B2A 100%)',
          color: '#FFFFFF',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
          margin: '12px'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            {/* Top Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                FinTrack
              </h2>
            </div>

            {/* Headline with animated cross-fade */}
            <div key={mode} className="auth-fade-in">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '1rem',
                letterSpacing: '0.05em'
              }}>
                TRACK. ANALYZE. SAVE.
              </div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                lineHeight: 1.15,
                color: '#F8FAFC',
                marginBottom: '1.25rem',
                letterSpacing: '-0.03em'
              }}>
                {mode === 'login' ? (
                  <>
                    Personal finances,<br />
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#10B981', fontWeight: '400', marginRight: '0.25rem' }}>
                      smartly
                    </span>
                    managed.
                  </>
                ) : (
                  <>
                    Income, budgets & expenses,<br />
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#10B981', fontWeight: '400', marginRight: '0.25rem' }}>
                      seamlessly
                    </span>
                    unified.
                  </>
                )}
              </h1>

              <p style={{
                fontSize: '0.925rem',
                color: '#94A3B8',
                lineHeight: 1.65,
                maxWidth: '380px',
                marginBottom: '2.5rem'
              }}>
                {mode === 'login' 
                  ? 'Track your monthly salary, analyze daily outflows, and maximize your savings rate with intelligent analytics.'
                  : 'Create your account to track income streams, manage category budgets, and monitor stock-market styled trajectories.'
                }
              </p>
            </div>

            {/* Real System Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.9rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <Receipt size={14} />
                </div>
                <span>Expense Ledger with Receipts & Payment Modes</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.9rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <PieChart size={14} />
                </div>
                <span>Category Budgets & Live Headroom Tracking</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.9rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <FileSpreadsheet size={14} />
                </div>
                <span>Analytics Reports & CSV/Excel Data Export</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.9rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <Layers size={14} />
                </div>
                <span>Spring Cloud Gateway & Service Registry</span>
              </div>
            </div>
          </div>

          {/* Bottom Real Architecture Status */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
            <ShieldCheck size={15} color="#10B981" />
            <span>Database-per-Service Architecture • Spring Security 6</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Animated Form Container */}
        <div style={{
          padding: '3rem 2.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFFFFF',
          minHeight: '620px',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.18s ease, transform 0.18s ease'
        }}>
          {mode === 'login' ? (
            <div key="login-view" className="auth-animate-in">
              {/* Form Header */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                  Welcome back
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                  Sign in to your FinTrack corporate account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
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
                  marginBottom: '1.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                {/* Email / Username Field */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    EMAIL OR USERNAME
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Enter your username or email"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.6rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        color: '#0F172A',
                        fontSize: '0.925rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#10B981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                        e.target.style.background = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = '#F8FAFC';
                      }}
                    />
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.6rem 0.8rem 2.6rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        color: '#0F172A',
                        fontSize: '0.925rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#10B981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                        e.target.style.background = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = '#F8FAFC';
                      }}
                    />
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none', color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: '#10B981',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateForgotPassword) {
                        onNavigateForgotPassword();
                      } else {
                        window.history.pushState({}, '', '/forgot-password');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1E293B';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0F172A';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in to Dashboard'}
                </button>
              </form>

              {/* Switch to Register */}
              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#64748B' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Create one free
                </button>
              </div>
            </div>
          ) : (
            <div key="register-view" className="auth-animate-in">
              {/* Form Header */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                  Create an account
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                  Set up your FinTrack corporate administrator profile
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.825rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegSubmit}>
                {/* Full Name */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    FULL NAME
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={regData.fullName}
                      onChange={handleRegChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.68rem 1rem 0.68rem 2.4rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#0F172A',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        outline: 'none'
                      }}
                    />
                    <UserCheck size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Username & Email Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      USERNAME
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={regData.username}
                        onChange={handleRegChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.68rem 0.65rem 0.68rem 2.2rem',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          color: '#0F172A',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                      />
                      <User size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      EMAIL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        name="email"
                        placeholder="corp@domain.com"
                        value={regData.email}
                        onChange={handleRegChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.68rem 0.65rem 0.68rem 2.2rem',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          color: '#0F172A',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                      />
                      <Mail size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      PASSWORD
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={regData.password}
                        onChange={handleRegChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.68rem 0.65rem 0.68rem 2.2rem',
                          background: '#F8FAFC',
                          border: `1px solid ${regData.password ? strengthMeta.color : '#E2E8F0'}`,
                          borderRadius: '8px',
                          color: '#0F172A',
                          fontSize: '0.875rem',
                          outline: 'none',
                          transition: 'border-color 0.2s ease'
                        }}
                      />
                      <Lock size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      CONFIRM
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={regData.confirmPassword}
                        onChange={handleRegChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.68rem 0.65rem 0.68rem 2.2rem',
                          background: '#F8FAFC',
                          border: `1px solid ${regData.confirmPassword && regData.password === regData.confirmPassword ? '#10B981' : '#E2E8F0'}`,
                          borderRadius: '8px',
                          color: '#0F172A',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                      <Lock size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                {/* 🛡️ Real-Time Strong Password Requirements Panel */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.75rem 0.85rem',
                  marginBottom: '1.25rem'
                }}>
                  {/* Strength Meter Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Password Strength: <strong style={{ color: strengthMeta.color }}>{strengthMeta.label}</strong>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600' }}>
                      {validRulesCount}/5 rules met
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                    <div style={{
                      width: strengthMeta.width,
                      height: '100%',
                      background: strengthMeta.color,
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease, background 0.3s ease'
                    }} />
                  </div>

                  {/* 5 Real-Time Checkmark Rules */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.3rem' }}>
                    {passwordRules.map((rule, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.725rem',
                        color: rule.valid ? '#047857' : '#64748B',
                        fontWeight: rule.valid ? '600' : '400',
                        transition: 'color 0.15s ease'
                      }}>
                        {rule.valid ? (
                          <CheckCircle2 size={13} color="#10B981" />
                        ) : (
                          <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1.5px solid #CBD5E1', display: 'inline-block' }} />
                        )}
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.925rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1E293B';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0F172A';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>

              {/* Switch to Login */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748B' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* Footer Stack Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #F1F5F9',
            fontSize: '0.725rem',
            color: '#94A3B8',
            flexWrap: 'wrap'
          }}>
            <span>Spring Cloud Gateway</span>
            <span>•</span>
            <span>JWT Auth (:8081)</span>
            <span>•</span>
            <span>Eureka Registry (:9000)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
