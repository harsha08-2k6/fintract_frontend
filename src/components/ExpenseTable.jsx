import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Trash2, Pencil, Tag, Paperclip, Receipt, Plus } from 'lucide-react';

export const ExpenseTable = ({ expenses, onDelete, onEdit, onViewReceipt, onAddExpense }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#ECFDF5',
          color: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}>
          <Receipt size={28} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
          No Transactions Logged Yet
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
          Start recording business purchases, team meals, utility bills, or receipts to automatically calculate category budgets and financial analytics.
        </p>
        {onAddExpense && (
          <button onClick={onAddExpense} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            <span>Record First Expense</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Title & Description</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Payment</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Receipt</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const catColor = expense.category?.colorCode || '#10B981';
              const rawCatName = expense.category?.name || 'General';
              // Format category name nicely (e.g. HOUSING_AND_BILLS -> Housing & Bills)
              const formatCatName = (name) => {
                if (!name) return 'General';
                if (/^[A-Z0-9_]+$/.test(name)) {
                  return name.toLowerCase().split('_').map(w => w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
                return name;
              };
              const catName = formatCatName(rawCatName);

              // Standardized payment labels
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
                <tr 
                  key={expense.id}
                  style={{ 
                    borderBottom: '1px solid #F1F5F9', 
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600', color: '#0F172A' }}>{expense.title}</div>
                    {expense.description && (
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {expense.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: '#F1F5F9', 
                        color: '#334155', 
                        borderColor: '#E2E8F0',
                        fontSize: '0.725rem'
                      }}
                    >
                      <Tag size={11} color={catColor} />
                      {catName}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#475569'
                    }}>
                      {formatPayment(expense.paymentMethod || 'CARD')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: '700', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    {expense.receiptUrl ? (
                      <button
                        onClick={() => onViewReceipt && onViewReceipt(expense)}
                        className="btn btn-secondary btn-icon"
                        title="View Receipt Attachment"
                        style={{ padding: '0.35rem 0.5rem', color: '#059669', borderColor: '#A7F3D0' }}
                      >
                        <Paperclip size={14} />
                      </button>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(expense)}
                          className="btn btn-secondary btn-icon"
                          title="Edit this expense"
                          style={{ color: '#4F46E5', borderColor: '#C7D2FE', padding: '0.35rem' }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="btn btn-secondary btn-icon"
                          title="Delete this expense"
                          style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.35rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
