import React from 'react';
import { Tag, Trash2, Edit2, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export const CategoryCard = ({ category, spent = 0, onDelete, onEdit, onSelect }) => {
  const limit = parseFloat(category.budgetLimit) || 0;
  const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0;
  const percentage = Math.min(rawPercentage, 100);
  const isOverBudget = limit > 0 && spent >= limit;
  const isWarning = limit > 0 && rawPercentage >= 80 && !isOverBudget;
  const color = category.colorCode || '#10B981';
  const remaining = limit > 0 ? limit - spent : 0;

  // Determine bar fill color
  const barColor = isOverBudget ? '#DC2626' : isWarning ? '#F59E0B' : color;

  return (
    <div
      className="card"
      onClick={() => onSelect && onSelect(category)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (onSelect) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onSelect) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0
          }}>
            <Tag size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>{category.name}</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {category.isCustom ? 'Custom Category' : 'System Category'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => onEdit(category)}
              className="btn btn-secondary btn-icon"
              title="Edit category details & budget limit"
              style={{ padding: '0.35rem', color: '#64748B' }}
            >
              <Edit2 size={14} />
            </button>
          )}

          {category.isCustom && onDelete && (
            <button
              onClick={() => onDelete(category.id)}
              className="btn btn-secondary btn-icon"
              title="Delete category"
              style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.35rem' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {category.description && (
        <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
          {category.description}
        </p>
      )}

      {/* Budget Limit & Progress */}
      {limit > 0 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.45rem' }}>
            <span style={{ color: '#64748B' }}>
              Spent: <strong style={{ color: '#0F172A', fontWeight: '700' }}>{formatCurrency(spent)}</strong>
            </span>
            <span style={{ color: '#64748B' }}>
              Limit: <strong style={{ color: '#0F172A', fontWeight: '700' }}>{formatCurrency(limit)}</strong>
            </span>
          </div>

          {/* Progress Bar Container with explicit background and fill */}
          <div style={{
            width: '100%',
            height: '8px',
            background: '#E2E8F0',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              style={{
                width: `${Math.max(2, percentage)}%`,
                height: '100%',
                background: barColor,
                borderRadius: '9999px',
                transition: 'width 0.4s ease-in-out'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '500' }}>
              {rawPercentage.toFixed(0)}% utilized 
              {remaining > 0 ? (
                <span style={{ color: '#059669', marginLeft: '4px' }}>({formatCurrency(remaining)} left)</span>
              ) : remaining < 0 ? (
                <span style={{ color: '#DC2626', marginLeft: '4px' }}>({formatCurrency(Math.abs(remaining))} over)</span>
              ) : (
                <span style={{ color: '#D97706', marginLeft: '4px' }}>(₹0 left)</span>
              )}
            </span>

            {isOverBudget ? (
              <span className="badge badge-rose" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                <ShieldAlert size={11} /> Over Budget
              </span>
            ) : isWarning ? (
              <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                <AlertTriangle size={11} /> Approaching Limit
              </span>
            ) : (
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                <CheckCircle2 size={11} /> Safe
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 0.95rem',
          background: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          fontSize: '0.8rem'
        }}>
          <div>
            <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', fontSize: '0.7rem', marginRight: '0.5rem' }}>
              Uncapped
            </span>
            <span style={{ color: '#64748B', fontWeight: '600' }}>
              Spent: <strong style={{ color: '#0F172A' }}>{formatCurrency(spent)}</strong>
            </span>
          </div>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#10B981',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              + Set Limit
            </button>
          )}
        </div>
      )}

      {/* Footer prompt to view matching transactions */}
      {onSelect && (
        <div style={{
          paddingTop: '0.65rem',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.76rem',
          color: '#64748B'
        }}>
          <span>Inspect {category.name} records</span>
          <span style={{
            color: '#10B981',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            View Transactions →
          </span>
        </div>
      )}
    </div>
  );
};
