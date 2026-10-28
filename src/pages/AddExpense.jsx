import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { notificationService } from '../services/notificationService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import {
  PlusCircle,
  IndianRupee,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';

export const AddExpense = ({ onSuccess, onCancel, onNavigateCategories }) => {
  const [categories, setCategories] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    categoryId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CARD',
    description: '',
    receiptUrl: '',
    receiptFileName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [savedExpense, setSavedExpense] = useState(null);

  // Normalize category name helper
  const formatCatName = (name) => {
    if (!name) return 'General';
    if (/^[A-Z0-9_]+$/.test(name)) {
      return name
        .toLowerCase()
        .split('_')
        .map(word => (word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(' ');
    }
    return name;
  };

  const loadData = async () => {
    try {
      const [catData, expData] = await Promise.all([
        categoryService.getAllCategories().catch(() => []),
        expenseService.getExpenses({}).catch(() => [])
      ]);

      const catList = Array.isArray(catData)
        ? catData
        : (catData && Array.isArray(catData.content) ? catData.content : []);
      
      const rawExpList = Array.isArray(expData)
        ? expData
        : (expData && Array.isArray(expData.content) ? expData.content : []);
      const expList = rawExpList.filter(item => item.type !== 'INCOME');

      setCategories(catList);
      setAllExpenses(expList);

      if (catList.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: String(catList[0].id) }));
      }
    } catch (err) {
      console.error('Could not load categories or expenses:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Quick Amount preset handler without form submission
  const handleQuickAmount = (val) => {
    setError('');
    setFormData(prev => {
      const current = parseFloat(prev.amount) || 0;
      const next = current > 0 ? (current + val).toString() : val.toString();
      return { ...prev, amount: next };
    });
  };

  // Receipt File validation and upload handling
  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce PNG/JPEG restrictions
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
      e.target.value = '';
      return;
    }

    // Enforce 2MB limit (2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`File size exceeds 2MB limit (uploaded: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please choose a smaller file.`);
      e.target.value = '';
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        receiptUrl: reader.result,
        receiptFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setFormData(prev => ({
      ...prev,
      receiptUrl: '',
      receiptFileName: ''
    }));
  };

  // Selected Category and Month Computation for Live Budget Feedback
  const liveBudgetFeedback = useMemo(() => {
    if (!formData.categoryId) return null;

    const selectedCat = categories.find(c => String(c.id) === String(formData.categoryId));
    if (!selectedCat) return null;

    const catName = formatCatName(selectedCat.name);
    const budgetLimit = parseFloat(selectedCat.budgetLimit) || 0;

    // Determine target month from the selected transaction date (default to current month)
    const txDate = formData.expenseDate || new Date().toISOString().split('T')[0];
    const targetMonthPrefix = txDate.slice(0, 7); // e.g. "2026-10"

    // Calculate existing spending in this category for the selected month
    const existingSpent = allExpenses
      .filter(exp => {
        const expCatId = exp.categoryId || exp.category?.id;
        const matchesCat = String(expCatId) === String(selectedCat.id) ||
                           (exp.category?.name && exp.category.name.toLowerCase() === selectedCat.name.toLowerCase());
        const expDate = exp.expenseDate || exp.transactionDate || '';
        const matchesMonth = expDate.startsWith(targetMonthPrefix);
        return matchesCat && matchesMonth;
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    const enteredAmount = parseFloat(formData.amount) || 0;
    const projectedSpend = existingSpent + enteredAmount;
    const remainingBudget = budgetLimit - projectedSpend;
    const isExceeded = budgetLimit > 0 && projectedSpend > budgetLimit;
    const excessAmount = isExceeded ? projectedSpend - budgetLimit : 0;
    const usagePercent = budgetLimit > 0 ? (projectedSpend / budgetLimit) * 100 : 0;

    // Format human-readable month name (e.g., October 2026)
    const monthDate = new Date(`${targetMonthPrefix}-01T00:00:00`);
    const monthLabel = !isNaN(monthDate.getTime())
      ? monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      : targetMonthPrefix;

    return {
      catName,
      monthLabel,
      budgetLimit,
      existingSpent,
      enteredAmount,
      projectedSpend,
      remainingBudget,
      isExceeded,
      excessAmount,
      usagePercent
    };
  }, [formData.categoryId, formData.expenseDate, formData.amount, categories, allExpenses]);

  // Comprehensive Form Submission with Anti-Double Click Protection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate clicks

    setError('');
    setSuccessMsg('');
    setSavedExpense(null);

    // Frontend validations
    const titleClean = formData.title.trim();
    if (!titleClean) {
      setError('Please provide an expense title or merchant name.');
      return;
    }

    const amtNum = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amtNum) || !isFinite(amtNum) || amtNum <= 0) {
      setError('Please enter a valid positive amount greater than ₹0.00.');
      return;
    }

    if (!formData.categoryId) {
      setError('Please select an expense category.');
      return;
    }

    if (!formData.expenseDate) {
      setError('Please provide a valid transaction date.');
      return;
    }

    if (!formData.paymentMethod) {
      setError('Please choose a payment method.');
      return;
    }

    setLoading(true);

    try {
      const selectedCat = categories.find(c => String(c.id) === String(formData.categoryId));

      const payload = {
        title: titleClean,
        amount: amtNum,
        categoryId: parseInt(formData.categoryId, 10),
        category: selectedCat ? { id: selectedCat.id, name: selectedCat.name, colorCode: selectedCat.colorCode } : null,
        expenseDate: formData.expenseDate,
        transactionDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim(),
        receiptUrl: formData.receiptUrl || null
      };

      const result = await transactionService.createExpense(payload);

      setSavedExpense(result || payload);
      setSuccessMsg(`Expense of ${formatCurrency(amtNum)} recorded successfully!`);

      // 1. Transaction Notification
      const catDisplayName = selectedCat ? formatCatName(selectedCat.name) : 'General';
      notificationService.createNotification({
        title: 'Expense recorded successfully',
        message: `${formatCurrency(amtNum)} expense added to ${catDisplayName}.`,
        category: 'TRANSACTION',
        severity: 'INFO',
        actionUrl: 'expenses',
        metadata: { title: titleClean, amount: amtNum, categoryName: catDisplayName }
      });

      // 2. Budget Alert Notification (if budget threshold exceeded or reached)
      if (liveBudgetFeedback && selectedCat && parseFloat(selectedCat.budgetLimit) > 0) {
        const limitVal = parseFloat(selectedCat.budgetLimit);
        const newUsage = liveBudgetFeedback.usagePercent;
        if (liveBudgetFeedback.isBreached) {
          notificationService.createNotification({
            title: `${catDisplayName} budget exceeded!`,
            message: `Spending reached ${formatCurrency(liveBudgetFeedback.newTotalSpent)} against the ${formatCurrency(limitVal)} monthly cap.`,
            category: 'BUDGET',
            severity: 'CRITICAL',
            actionUrl: 'categories',
            metadata: { categoryId: selectedCat.id, spent: liveBudgetFeedback.newTotalSpent, limit: limitVal }
          });
        } else if (newUsage >= 80) {
          const remainingAmt = Math.max(0, limitVal - liveBudgetFeedback.newTotalSpent);
          notificationService.createNotification({
            title: `${catDisplayName} budget is ${Math.round(newUsage)}% used`,
            message: `Only ${formatCurrency(remainingAmt)} remaining of ${formatCurrency(limitVal)} monthly limit.`,
            category: 'BUDGET',
            severity: 'WARNING',
            actionUrl: 'categories',
            metadata: { categoryId: selectedCat.id, spent: liveBudgetFeedback.newTotalSpent, limit: limitVal }
          });
        }
      }

      // Reset form but keep current category & date for easy subsequent entries
      setFormData(prev => ({
        ...prev,
        title: '',
        amount: '',
        description: '',
        receiptUrl: '',
        receiptFileName: ''
      }));

      // Reload dataset to update the live feedback on subsequent entries
      await loadData();

      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save expense. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
            }}>
              <PlusCircle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Record New Expense
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
                Enter expense details with live budget reconciliation and receipt verification
              </p>
            </div>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '8px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{error}</div>
            <button
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span>{successMsg}</span>
            </div>
            {onSuccess && (
              <button
                type="button"
                onClick={onSuccess}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#065F46', borderColor: '#A7F3D0' }}
              >
                View in Expenses →
              </button>
            )}
          </div>
        )}

        {/* LIVE BUDGET FEEDBACK CARD (P0 Feature) */}
        {liveBudgetFeedback && (
          <div style={{
            background: liveBudgetFeedback.isExceeded ? '#FFFBEB' : '#F8FAFC',
            border: `1.5px solid ${liveBudgetFeedback.isExceeded ? '#FCD34D' : '#E2E8F0'}`,
            borderRadius: '10px',
            padding: '1.25rem 1.4rem',
            marginBottom: '1.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color={liveBudgetFeedback.isExceeded ? '#D97706' : '#10B981'} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  {liveBudgetFeedback.catName} Budget Preview ({liveBudgetFeedback.monthLabel})
                </h3>
              </div>
              {liveBudgetFeedback.isExceeded ? (
                <span className="badge" style={{ background: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} color="#DC2626" />
                  Exceeds limit by {formatCurrency(liveBudgetFeedback.excessAmount)} (Saving allowed per policy)
                </span>
              ) : liveBudgetFeedback.usagePercent >= 100 ? (
                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle size={12} color="#D97706" />
                  100% Limit Reached (₹0 remaining)
                </span>
              ) : liveBudgetFeedback.usagePercent >= 80 ? (
                <span className="badge" style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle size={12} color="#D97706" />
                  Caution: {liveBudgetFeedback.usagePercent.toFixed(0)}% budget utilized
                </span>
              ) : (
                <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                  Budget Healthy ({liveBudgetFeedback.usagePercent.toFixed(0)}% used)
                </span>
              )}
            </div>

            {/* 5-Column Reconciled Metrics Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: '#FFFFFF', padding: '0.65rem 0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Budget</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                  {formatCurrency(liveBudgetFeedback.budgetLimit)}
                </span>
              </div>

              <div style={{ background: '#FFFFFF', padding: '0.65rem 0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Already Spent</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155', marginTop: '2px', display: 'block' }}>
                  {formatCurrency(liveBudgetFeedback.existingSpent)}
                </span>
              </div>

              <div style={{ background: '#FFFFFF', padding: '0.65rem 0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>New Expense</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#10B981', marginTop: '2px', display: 'block' }}>
                  +{formatCurrency(liveBudgetFeedback.enteredAmount)}
                </span>
              </div>

              <div style={{ background: '#FFFFFF', padding: '0.65rem 0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Projected Spending</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: liveBudgetFeedback.isExceeded ? '#DC2626' : '#0F172A', marginTop: '2px', display: 'block' }}>
                  {formatCurrency(liveBudgetFeedback.projectedSpend)}
                </span>
              </div>

              <div style={{ background: '#FFFFFF', padding: '0.65rem 0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>Budget Remaining</span>
                <span style={{
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  color: liveBudgetFeedback.remainingBudget < 0 ? '#DC2626' : '#10B981',
                  marginTop: '2px',
                  display: 'block'
                }}>
                  {formatCurrency(liveBudgetFeedback.remainingBudget)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, liveBudgetFeedback.usagePercent)}%`,
                  height: '100%',
                  background: liveBudgetFeedback.isExceeded ? '#EF4444' : liveBudgetFeedback.usagePercent >= 80 ? '#F59E0B' : '#10B981',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid-2">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Expense Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Flight Tickets, AWS Cloud, Team Lunch"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem', fontSize: '1.15rem', fontWeight: '700' }}
                />
                <IndianRupee size={17} color="#0F172A" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {/* Quick Amount presets in INR */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                {[100, 250, 500, 1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    style={{
                      padding: '0.2rem 0.55rem',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      color: '#334155',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  >
                    +₹{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '0.5rem' }}>
            {/* Category */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Category *</label>
                {onNavigateCategories && (
                  <button
                    type="button"
                    onClick={onNavigateCategories}
                    style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Manage Budgets
                  </button>
                )}
              </div>
              <select
                name="categoryId"
                className="form-select"
                value={formData.categoryId}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {formatCatName(cat.name)} ({formatCurrency(cat.budgetLimit || 0)} limit)
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Date */}
            <div className="form-group">
              <label className="form-label">Transaction Date *</label>
              <input
                type="date"
                name="expenseDate"
                className="form-input"
                value={formData.expenseDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                name="paymentMethod"
                className="form-select"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="CARD">Card (Credit / Debit)</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Secure Receipt Upload Section (P1) */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Receipt Document Attachment (Optional)
              </label>
              {formData.receiptUrl && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label
                    style={{ color: '#4F46E5', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}
                  >
                    <RefreshCw size={12} /> Replace
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleReceiptFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}
                  >
                    <X size={13} /> Remove
                  </button>
                </div>
              )}
            </div>

            {formData.receiptUrl ? (
              <div style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1.5px solid #10B981',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: '#F0FDF4'
              }}>
                <img
                  src={formData.receiptUrl}
                  alt="Receipt Preview"
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #BBF7D0' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formData.receiptFileName || 'Receipt Image Attached'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block', marginTop: '2px' }}>
                    Validated & attached to transaction record
                  </span>
                </div>
              </div>
            ) : (
              <label
                className="receipt-dropzone"
                style={{
                  display: 'block',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleReceiptFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <ImageIcon size={28} color="#64748B" />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>
                    Click to upload receipt image
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    PNG, JPG, or WEBP up to 2 MB
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Notes & Description (Optional)</label>
            <textarea
              name="description"
              rows={2}
              className="form-textarea"
              placeholder="Add merchant details, purpose, invoice number, or project code..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.75rem' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem' }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                minWidth: '170px',
                padding: '0.65rem 1.4rem',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving Expense...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

