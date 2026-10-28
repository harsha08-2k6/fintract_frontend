import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { getPasswordRuleResults, isStrongPassword } from '../utils/passwordValidation';

export const ResetPassword = ({ onNavigateLogin, onNavigateForgotPassword }) => {
  const [token, setToken] = useState('');
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam || !tokenParam.trim()) {
      setValidating(false);
      setTokenValid(false);
      setTokenError('No password reset token was provided in the link.');
      return;
    }

    const cleanToken = tokenParam.trim();
    setToken(cleanToken);

    // Validate token on server
    const checkToken = async () => {
      try {
        const response = await authService.validateResetToken(cleanToken);
        if (response && response.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError('This password reset link has expired or has already been used.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError(err.message || 'Unable to verify reset link.');
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, []);

  const passwordRules = getPasswordRuleResults(newPassword);
  const validRulesCount = passwordRules.filter(r => r.valid).length;
  const passwordIsStrong = isStrongPassword(newPassword);

  const getStrengthMeta = () => {
    if (newPassword.length === 0) return { label: 'Empty', color: '#94A3B8', width: '0%' };
    if (validRulesCount <= 2) return { label: 'Weak', color: '#DC2626', width: '25%' };
    if (validRulesCount <= 3) return { label: 'Fair', color: '#F59E0B', width: '50%' };
    if (validRulesCount === 4) return { label: 'Good', color: '#3B82F6', width: '75%' };
    return { label: 'Strong', color: '#10B981', width: '100%' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!passwordIsStrong) {
      setSubmitError('Please satisfy all password security requirements before proceeding.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
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
              CREDENTIAL RE-KEYING
            </div>

            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '800',
              lineHeight: 1.18,
              color: '#F8FAFC',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em'
            }}>
              Choose your<br />
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#10B981', fontWeight: '400', marginRight: '0.25rem' }}>
                new
              </span>
              password.
            </h1>

            <p style={{
              fontSize: '0.925rem',
              color: '#94A3B8',
              lineHeight: 1.65,
              maxWidth: '380px',
              marginBottom: '2.5rem'
            }}>
              Create a strong, unique password for your FinTrack profile. Once updated, your credentials will be hashed using BCrypt and all previous recovery tokens will be revoked.
            </p>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
            <ShieldCheck size={15} color="#10B981" />
            <span>BCrypt Password Hashing • Atomic Token Consumption</span>
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
          {validating ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#10B981',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '1rem' }}>
                Verifying password reset token...
              </p>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEF2F2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                marginBottom: '1.5rem',
                border: '2px solid #FECACA'
              }}>
                <AlertCircle size={32} />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Invalid or Expired Link
              </h2>

              <p style={{ color: '#64748B', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                {tokenError || 'This password reset link is invalid, has expired, or has already been used. Please request a fresh reset link.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.925rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Request New Reset Link
                </button>

                <button
                  type="button"
                  onClick={onNavigateLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : success ? (
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
                Password Updated!
              </h2>

              <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Your password has been successfully reset. You can now sign in with your new credentials.
              </p>

              <button
                type="button"
                onClick={onNavigateLogin}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                }}
              >
                Sign In to Dashboard
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                  Set new password
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                  Please enter your new password below.
                </p>
              </div>

              {submitError && (
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
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    NEW PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.6rem 0.8rem 2.6rem',
                        background: '#F8FAFC',
                        border: `1px solid ${newPassword ? strengthMeta.color : '#E2E8F0'}`,
                        borderRadius: '10px',
                        color: '#0F172A',
                        fontSize: '0.925rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
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

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    CONFIRM NEW PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.6rem 0.8rem 2.6rem',
                        background: '#F8FAFC',
                        border: `1px solid ${confirmPassword && newPassword === confirmPassword ? '#10B981' : '#E2E8F0'}`,
                        borderRadius: '10px',
                        color: '#0F172A',
                        fontSize: '0.925rem',
                        fontWeight: '500',
                        outline: 'none'
                      }}
                    />
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Strength: <strong style={{ color: strengthMeta.color }}>{strengthMeta.label}</strong>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600' }}>
                      {validRulesCount}/5 rules met
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: strengthMeta.width,
                      height: '100%',
                      background: strengthMeta.color,
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease, background 0.3s ease'
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem' }}>
                    {passwordRules.map((rule, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.725rem',
                        color: rule.valid ? '#047857' : '#64748B',
                        fontWeight: rule.valid ? '600' : '400'
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

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                    opacity: submitting ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = '#1E293B';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = '#0F172A';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {submitting ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
