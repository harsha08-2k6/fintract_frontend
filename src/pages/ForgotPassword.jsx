import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';

export const ForgotPassword = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email format (e.g. name@company.com).');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setSubmitted(true);
    } catch (err) {
      // For user safety and enumeration prevention, show generic error or handle rate limiting
      setError(err.message || 'Unable to submit reset request. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: '#F1F5F9',
      fontFamily: 'var(--font-main, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
    }}>
      <div style={{
        maxWidth: '1000px',
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
        
        {/* LEFT COLUMN: Deep Navy Showcase */}
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
              ACCOUNT RECOVERY
            </div>

            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '800',
              lineHeight: 1.18,
              color: '#F8FAFC',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em'
            }}>
              Protecting your<br />
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#10B981', fontWeight: '400', marginRight: '0.25rem' }}>
                financial
              </span>
              credentials.
            </h1>

            <p style={{
              fontSize: '0.925rem',
              color: '#94A3B8',
              lineHeight: 1.65,
              maxWidth: '380px',
              marginBottom: '2.5rem'
            }}>
              Our password recovery protocol issues cryptographically signed, single-use reset tokens with strict 30-minute expirations to ensure your expense ledgers and financial data remain secure.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.875rem' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <KeyRound size={13} />
                </div>
                <span>32-Byte Cryptographic SHA-256 Tokens</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E2E8F0', fontSize: '0.875rem' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <ShieldCheck size={13} />
                </div>
                <span>Zero Account Enumeration Exposure</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
            <ShieldCheck size={15} color="#10B981" />
            <span>Gmail SMTP Relay • STARTTLS 587 Encryption</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Card */}
        <div style={{
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFFFFF'
        }}>
          {!submitted ? (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '1.25rem',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                >
                  <ArrowLeft size={16} />
                  <span>Back to sign in</span>
                </button>

                <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                  Forgot password?
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Enter the email address registered with your FinTrack account. We'll send you a secure link to reset your password.
                </p>
              </div>

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

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    REGISTERED EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.6rem',
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

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                    opacity: loading ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#1E293B';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#0F172A';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {loading ? 'Sending Instructions...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                marginBottom: '1.5rem',
                border: '2px solid #A7F3D0'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Instructions Sent
              </h2>

              <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                If an account exists for <strong style={{ color: '#0F172A' }}>{email}</strong>, a password reset link has been dispatched.
              </p>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.825rem',
                color: '#64748B',
                textAlign: 'left',
                lineHeight: 1.5,
                marginBottom: '2rem'
              }}>
                <div style={{ fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                  Important Security Details:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>The link is active for <strong>30 minutes</strong> and is strictly single-use.</li>
                  <li>Check your spam or junk folder if the email does not appear in a few moments.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.925rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  Return to Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Send to a different email address
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
