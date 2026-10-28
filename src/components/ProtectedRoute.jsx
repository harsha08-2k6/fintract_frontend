import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, onNavigateLogin }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#10B981' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '500' }}>Loading FinTrack...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Authentication Required</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Please sign in to access your financial dashboard and expenses.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onNavigateLogin}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};
