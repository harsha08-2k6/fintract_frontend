import React, { useState, useEffect, useMemo } from 'react';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseCard } from '../components/ExpenseCard';
import { Modal } from '../components/Modal';
import {
  Search,
  LayoutList,
  LayoutGrid,
  Plus,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  FileCode,
  ArrowUpDown,
  Receipt,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export const Expenses = ({ onNavigateAddExpense, initialCategory = '', initialStartDate = '', initialEndDate = '' }) => {
  const [allExpenses, setAllExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [datePreset, setDatePreset] = useState(initialStartDate ? 'CUSTOM' : 'ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('table');
  const [loading, setLoading] = useState(true);

  // Notifications banner state (success / error feedback)
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Modal for viewing receipt image
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState(null);

  // Helper to normalize and prettify category names (e.g. 'EDUCATION' -> 'Education', 'HOUSING_AND_BILLS' -> 'Housing & Bills')
  const formatCategoryName = (name) => {
    if (!name) return 'General';
    if (/^[A-Z0-9_]+$/.test(name)) {
      return name
        .toLowerCase()
        .split('_')
        .map(word => {
          if (word === 'and') return '&';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }
    return name;
  };

  // Standardize payment method labels (e.g. CARD -> Card, BANK_TRANSFER -> Bank Transfer)
  const formatPaymentMethod = (method) => {
    if (!method) return 'Card';
    const map = {
      BANK_TRANSFER: 'Bank Transfer',
      CARD: 'Card',
      UPI: 'UPI',
      CASH: 'Cash',
      OTHER: 'Other'
    };
    return map[method] || method;
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // Fetch all expense and category data so client-side filtering works seamlessly
      const [expenseData, categoryData] = await Promise.all([
        expenseService.getExpenses({}).catch(() => []),
        categoryService.getAllCategories().catch(() => [])
      ]);

      const rawList = Array.isArray(expenseData)
        ? expenseData
        : (expenseData && Array.isArray(expenseData.content) ? expenseData.content : []);
      const expList = rawList.filter(item => item.type !== 'INCOME');
      const catList = Array.isArray(categoryData)
        ? categoryData
        : (categoryData && Array.isArray(categoryData.content) ? categoryData.content : []);

      setAllExpenses(expList);
      setCategories(catList);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      showNotification('error', 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      setStartDate(`${yyyy}-${mm}-01`);
      setEndDate(`${yyyy}-${mm}-${dd}`);
    } else if (preset === 'LAST_30') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      const pastY = past.getFullYear();
      const pastM = String(past.getMonth() + 1).padStart(2, '0');
      const pastD = String(past.getDate()).padStart(2, '0');
      setStartDate(`${pastY}-${pastM}-${pastD}`);
      setEndDate(`${yyyy}-${mm}-${dd}`);
    } else if (preset === 'THIS_YEAR') {
      setStartDate(`${yyyy}-01-01`);
      setEndDate(`${yyyy}-12-31`);
    }
  };

  // Modal for editing expense
  const [editingExpense, setEditingExpense] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const handleOpenEdit = (expense) => {
    setEditError('');
    setEditingExpense({
      ...expense,
      amount: expense.amount || '',
      categoryId: expense.categoryId || expense.category?.id || '',
      expenseDate: expense.expenseDate || expense.transactionDate || new Date().toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod || 'CARD',
      description: expense.description || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingExpense?.title?.trim() || !editingExpense.amount || Number(editingExpense.amount) <= 0) {
      setEditError('Enter a valid title and positive amount.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      await expenseService.updateExpense(editingExpense.id, {
        title: editingExpense.title.trim(),
        amount: Number(editingExpense.amount),
        categoryId: Number(editingExpense.categoryId) || null,
        expenseDate: editingExpense.expenseDate,
        transactionDate: editingExpense.expenseDate,
        paymentMethod: editingExpense.paymentMethod,
        description: editingExpense.description || '',
        receiptUrl: editingExpense.receiptUrl || ''
      });
      const updatedTitle = editingExpense.title.trim();
      setEditingExpense(null);
      await fetchExpenses();
      showNotification('success', `Expense "${updatedTitle}" updated successfully.`);
    } catch (err) {
      setEditError(err.message || 'Failed to update expense');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    const target = allExpenses.find(e => String(e.id) === String(id));
    const targetTitle = target?.title || 'Expense';
    if (window.confirm(`Are you sure you want to delete "${targetTitle}"? This action cannot be undone.`)) {
      try {
        await expenseService.deleteExpense(id);
        await fetchExpenses();
        showNotification('success', `"${targetTitle}" deleted successfully.`);
      } catch (err) {
        showNotification('error', 'Delete failed: ' + err.message);
      }
    }
  };

  // Filtered and sorted list based on search, category, payment method, and dates
  const filteredAndSortedExpenses = useMemo(() => {
    let list = [...allExpenses];

    // Category filter: match either categoryId or category name
    if (selectedCategory) {
      list = list.filter(exp => {
        const catId = exp.categoryId || exp.category?.id;
        const catName = exp.category?.name;
        return String(catId) === String(selectedCategory) || 
               (selectedCategory && catName && catName.toLowerCase() === selectedCategory.toLowerCase());
      });
    }

    // Payment method filter
    if (selectedPayment !== 'ALL') {
      list = list.filter(exp => exp.paymentMethod === selectedPayment);
    }

    // Date range filter
    if (startDate) {
      list = list.filter(exp => {
        const date = exp.expenseDate || exp.transactionDate || '';
        return date >= startDate;
      });
    }
    if (endDate) {
      list = list.filter(exp => {
        const date = exp.expenseDate || exp.transactionDate || '';
        return date <= endDate;
      });
    }

    // Search query filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(exp => (
        exp.title?.toLowerCase().includes(term) ||
        exp.description?.toLowerCase().includes(term) ||
        exp.category?.name?.toLowerCase().includes(term) ||
        exp.paymentMethod?.toLowerCase().includes(term)
      ));
    }

    // Sorting
    list.sort((a, b) => {
      const dateA = a.expenseDate || a.transactionDate || 0;
      const dateB = b.expenseDate || b.transactionDate || 0;
      if (sortBy === 'date_desc') {
        return new Date(dateB) - new Date(dateA);
      } else if (sortBy === 'date_asc') {
        return new Date(dateA) - new Date(dateB);
      } else if (sortBy === 'amount_desc') {
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      } else if (sortBy === 'amount_asc') {
        return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      } else if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return list;
  }, [allExpenses, selectedCategory, selectedPayment, startDate, endDate, searchTerm, sortBy]);

  // Reactive Summary Statistics for active filtered subset
  const stats = useMemo(() => {
    const count = filteredAndSortedExpenses.length;
    const total = filteredAndSortedExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const avg = count > 0 ? total / count : 0;
    const max = filteredAndSortedExpenses.reduce((m, exp) => Math.max(m, parseFloat(exp.amount) || 0), 0);

    return { count, total, avg, max };
  }, [filteredAndSortedExpenses]);

  const handleExportCSV = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'amount', label: 'Amount (₹)', formatter: (item) => parseFloat(item.amount).toFixed(2) },
      { key: 'category', label: 'Category', formatter: (item) => formatCategoryName(item.category?.name) },
      { key: 'expenseDate', label: 'Date', formatter: (item) => item.expenseDate || item.transactionDate },
      { key: 'paymentMethod', label: 'Payment Method', formatter: (item) => formatPaymentMethod(item.paymentMethod) },
      { key: 'rawPaymentMethod', label: 'Payment Method (Raw)', formatter: (item) => item.paymentMethod || 'CARD' },
      { key: 'description', label: 'Notes', formatter: (item) => item.description || '' },
      { key: 'receiptUrl', label: 'Has Receipt', formatter: (item) => item.receiptUrl ? 'YES' : 'NO' }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    exportToCSV(filteredAndSortedExpenses, `fintrack_expenses_${todayStr}.csv`, columns);
  };

  const handleExportJSON = () => {
    const formattedData = filteredAndSortedExpenses.map(item => ({
      ...item,
      categoryName: formatCategoryName(item.category?.name),
      formattedPaymentMethod: formatPaymentMethod(item.paymentMethod)
    }));
    const todayStr = new Date().toISOString().split('T')[0];
    exportToJSON(formattedData, `fintrack_expenses_${todayStr}.json`);
  };

  const paymentOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'CARD', label: 'Card' },
    { id: 'UPI', label: 'UPI' },
    { id: 'CASH', label: 'Cash' },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { id: 'OTHER', label: 'Other' }
  ];

  return (
    <div className="page-wrapper">
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          borderRadius: '8px',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.875rem',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease-in-out'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
          <div style={{ flex: 1 }}>{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px', display: 'flex', alignItems: 'center' }}
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0F172A' }}>Expense Tracker</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Search, filter, export, and manage your daily expenses
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.9rem' }}
            title={`Export all ${filteredAndSortedExpenses.length} filtered records to CSV for Excel`}
          >
            <FileSpreadsheet size={15} color="#10B981" />
            <span>Export Filtered CSV ({filteredAndSortedExpenses.length})</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
            title={`Export all ${filteredAndSortedExpenses.length} filtered records as JSON`}
          >
            <FileCode size={15} color="#4F46E5" />
            <span>JSON</span>
          </button>

          {/* Toggle View Mode */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('table')}
              className="btn btn-icon"
              style={{
                background: viewMode === 'table' ? '#10B981' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : '#64748B',
                padding: '0.4rem 0.6rem'
              }}
              title="Table View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className="btn btn-icon"
              style={{
                background: viewMode === 'cards' ? '#10B981' : 'transparent',
                color: viewMode === 'cards' ? '#FFFFFF' : '#64748B',
                padding: '0.4rem 0.6rem'
              }}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button onClick={onNavigateAddExpense} className="btn btn-primary" style={{ padding: '0.55rem 1.1rem' }}>
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Ribbon */}
      <div className="stats-ribbon">
        <div className="stat-item">
          <span className="stat-label">Total Filtered Spend</span>
          <span className="stat-value" style={{ color: '#0F172A' }}>
            {formatCurrency(stats.total)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Per Expense</span>
          <span className="stat-value">
            {formatCurrency(stats.avg)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Biggest Expense</span>
          <span className="stat-value" style={{ color: '#0F172A' }}>
            {formatCurrency(stats.max)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Expenses Count</span>
          <span className="stat-value">
            {stats.count} records
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search expenses, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {formatCategoryName(cat.name)}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
              <option value="title_asc">Title: A to Z</option>
            </select>
            <ArrowUpDown size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Date Range Start & End */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              title="Start Date"
              style={{ fontSize: '0.8rem', padding: '0.6rem 0.5rem' }}
            />
            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              title="End Date"
              style={{ fontSize: '0.8rem', padding: '0.6rem 0.5rem' }}
            />
          </div>
        </div>

        {/* Quick Date Presets & Payment Method Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Quick Date Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', marginRight: '0.25rem' }}>PERIOD:</span>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_30', label: 'Last 30 Days' },
              { id: 'THIS_YEAR', label: 'This Year' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyDatePreset(preset.id)}
                className={`pill-btn ${datePreset === preset.id ? 'active' : ''}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Payment Method Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', marginRight: '0.25rem' }}>PAYMENT:</span>
            {paymentOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedPayment(opt.id)}
                className={`pill-btn ${selectedPayment === opt.id ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Content List / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748B' }}>Loading expenses...</p>
        </div>
      ) : filteredAndSortedExpenses.length === 0 ? (
        <ExpenseTable
          expenses={[]}
          onAddExpense={onNavigateAddExpense}
        />
      ) : viewMode === 'table' ? (
        <ExpenseTable
          expenses={filteredAndSortedExpenses}
          onDelete={handleDelete}
          onEdit={handleOpenEdit}
          onViewReceipt={(expense) => setSelectedReceiptExpense(expense)}
          onAddExpense={onNavigateAddExpense}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredAndSortedExpenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              onDelete={handleDelete}
              onViewReceipt={(expense) => setSelectedReceiptExpense(expense)}
            />
          ))}
        </div>
      )}

      {/* Edit Expense Modal */}
      <Modal isOpen={Boolean(editingExpense)} onClose={() => setEditingExpense(null)} title="Edit Expense Record">
        <form onSubmit={handleEditSubmit}>
          {editError && <div className="form-error" style={{ marginBottom: '1rem', color: '#DC2626' }}>{editError}</div>}
          <div className="form-group">
            <label className="form-label">Expense Title *</label>
            <input
              type="text"
              className="form-input"
              required
              value={editingExpense?.title || ''}
              onChange={(e) => setEditingExpense(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                required
                value={editingExpense?.amount || ''}
                onChange={(e) => setEditingExpense(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={editingExpense?.categoryId || ''}
                onChange={(e) => setEditingExpense(prev => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">General</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Expense Date</label>
              <input
                type="date"
                className="form-input"
                required
                value={editingExpense?.expenseDate || ''}
                onChange={(e) => setEditingExpense(prev => ({ ...prev, expenseDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={editingExpense?.paymentMethod || 'CARD'}
                onChange={(e) => setEditingExpense(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={editingExpense?.description || ''}
              onChange={(e) => setEditingExpense(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingExpense(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="btn btn-primary"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Inspection Modal */}
      {selectedReceiptExpense && (
        <Modal
          isOpen={!!selectedReceiptExpense}
          onClose={() => setSelectedReceiptExpense(null)}
          title={`Receipt: ${selectedReceiptExpense.title}`}
        >
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <div>
                <strong style={{ color: '#0F172A' }}>{formatDate(selectedReceiptExpense.expenseDate)}</strong>
                <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{selectedReceiptExpense.paymentMethod || 'CARD'}</p>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0F172A' }}>
                {formatCurrency(selectedReceiptExpense.amount)}
              </span>
            </div>

            <div style={{
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '400px',
              border: '1px solid #E2E8F0'
            }}>
              {selectedReceiptExpense.receiptUrl.startsWith('data:image') || selectedReceiptExpense.receiptUrl.startsWith('http') ? (
                <img
                  src={selectedReceiptExpense.receiptUrl}
                  alt="Expense receipt"
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  <Receipt size={48} color="#10B981" style={{ margin: '0 auto 1rem auto' }} />
                  <p>Document attachment reference:</p>
                  <code style={{ fontSize: '0.8rem', color: '#0F172A' }}>{selectedReceiptExpense.receiptUrl}</code>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedReceiptExpense(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
