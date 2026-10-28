import React from 'react';
import { Compass, ArrowLeft, LayoutDashboard } from 'lucide-react';

export const NotFound = ({ onNavigate }) => (
  <div className="page-wrapper">
    <div className="card" style={{ maxWidth: '680px', margin: '4rem auto', padding: '3.5rem 2rem', textAlign: 'center' }}>
      <div style={{ width: '58px', height: '58px', margin: '0 auto 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5', color: '#059669' }}>
        <Compass size={28} />
      </div>
      <p style={{ color: '#059669', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Error 404</p>
      <h2 style={{ marginTop: '0.5rem', fontSize: '2rem' }}>Page not found</h2>
      <p style={{ maxWidth: '430px', margin: '0.75rem auto 1.75rem', color: 'var(--text-secondary)' }}>
        The page you requested does not exist or may have moved. Return to your financial workspace to continue.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => window.history.length > 1 ? window.history.back() : onNavigate('dashboard')}>
          <ArrowLeft size={15} /> Go Back
        </button>
        <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
          <LayoutDashboard size={15} /> Dashboard
        </button>
      </div>
    </div>
  </div>
);
