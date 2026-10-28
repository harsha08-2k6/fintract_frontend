import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Activity } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatCurrency';

export const MetricStatCard = ({ 
  title, 
  value, 
  subtext, 
  change, 
  changeLabel,
  icon: Icon, 
  valueColor = '#0F172A',
  iconBg = '#F1F5F9',
  iconColor = '#64748B'
}) => {
  const isPositive = change !== undefined && change >= 0;
  const isIncrease = change !== undefined && change > 0;

  return (
    <div className="card" style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '1.4rem 1.5rem',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748B' }}>
          {title}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon ? <Icon size={18} /> : <IndianRupee size={18} />}
        </div>
      </div>

      <div style={{
        fontSize: '2rem',
        fontWeight: '800',
        fontFamily: 'var(--font-heading)',
        color: valueColor,
        letterSpacing: '-0.02em',
        marginBottom: '0.35rem'
      }}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        {change !== undefined && change !== null && !isNaN(change) && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            color: change < 0 ? '#DC2626' : (change > 0 ? '#16A34A' : '#64748B'),
            fontWeight: '700'
          }}>
            {change < 0 ? <TrendingDown size={14} color="#DC2626" /> : (change > 0 ? <TrendingUp size={14} color="#16A34A" /> : null)}
            {formatPercentage(change)}
          </span>
        )}
        {changeLabel && (
          <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{changeLabel}</span>
        )}
        {subtext && <span style={{ color: '#64748B' }}>{subtext}</span>}
      </div>
    </div>
  );
};
