import React from 'react';
import { Trash2, Calendar, CreditCard, Tag, Paperclip } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const ExpenseCard = ({ expense, onDelete, onClick, onViewReceipt }) => {
  const categoryColor = expense.category?.colorCode || '#10B981';
  const rawCatName = expense.category?.name || 'General';

  const formatCatName = (name) => {
    if (!name) return 'General';
    if (/^[A-Z0-9_]+$/.test(name)) {
      return name.toLowerCase().split('_').map(w => w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return name;
  };
  const categoryName = formatCatName(rawCatName);

  const formatPayment = (method) => {
    const map = {
      CARD: 'Card',
      UPI: 'UPI',
      CASH: 'Cash',
      BANK_TRANSFER: 'Bank Transfer',
      OTHER: 'Other'
    };
    return map[method] || method;
  };

  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'var(--transition)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Category color indicator */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          background: '#F1F5F9',
          border: `1px solid #E2E8F0`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: categoryColor,
          flexShrink: 0
        }}>
          <Tag size={18} />
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.2rem' }}>
            {expense.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.775rem', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} />
              {formatDate(expense.expenseDate)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CreditCard size={13} />
              {formatPayment(expense.paymentMethod || 'CARD')}
            </span>
            <span 
              className="badge" 
              style={{ 
                background: '#F8FAFC', 
                color: '#334155', 
                borderColor: '#E2E8F0',
                fontSize: '0.7rem' 
              }}
            >
              {categoryName}
            </span>

            {expense.receiptUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewReceipt) onViewReceipt(expense);
                }}
                className="badge badge-emerald"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem'
                }}
                title="View Attached Receipt"
              >
                <Paperclip size={11} />
                Receipt
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ 
            fontSize: '1.15rem', 
            fontWeight: '800', 
            fontFamily: 'var(--font-heading)',
            color: '#0F172A' 
          }}>
            -{formatCurrency(expense.amount)}
          </span>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(expense.id);
            }}
            className="btn btn-secondary btn-icon"
            title="Delete Expense"
            style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.4rem' }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
