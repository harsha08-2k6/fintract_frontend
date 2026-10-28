import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { Modal } from '../components/Modal';
import { 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet, 
  FileCode, 
  ArrowUpDown, 
  Receipt, 
  X,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Tag,
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export const Transactions = ({ onNavigateAddExpense, onNavigateIncome }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Notifications banner state (success / error feedback)
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Quick Inflow Modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    title: 'Monthly Salary',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  // Modal for receipt image
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txData, categoryData] = await Promise.all([
        transactionService.getAllTransactions().catch(() => []),
        categoryService.getAllCategories().catch(() => [])
      ]);

      const txList = Array.isArray(txData) ? txData : (txData?.content || []);
      const catList = Array.isArray(categoryData) ? categoryData : (categoryData?.content || []);

      setTransactions(txList);
      setCategories(catList);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showNotification('error', 'Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
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

  const handleDelete = async (id, title) => {
    const recordLabel = title ? `"${title}"` : 'this transaction';
    if (window.confirm(`Are you sure you want to delete ${recordLabel}? This action cannot be undone.`)) {
      try {
        await transactionService.deleteTransaction(id);
        await fetchTransactions();
        showNotification('success', `Transaction ${recordLabel} was successfully deleted.`);
      } catch (err) {
        showNotification('error', 'Failed to delete transaction: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const openEditModal = (transaction) => {
    setEditError('');
    setEditingTransaction({
      ...transaction,
      transactionDate: transaction.transactionDate || transaction.expenseDate || new Date().toISOString().split('T')[0],
      categoryId: transaction.categoryId || transaction.category?.id || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTransaction?.title?.trim() || !editingTransaction.amount || Number(editingTransaction.amount) <= 0) {
      setEditError('Enter a title and a positive amount.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      await transactionService.updateTransaction(editingTransaction.id, {
        type: editingTransaction.type,
        title: editingTransaction.title.trim(),
        amount: Number(editingTransaction.amount),
        categoryId: editingTransaction.type === 'EXPENSE' ? Number(editingTransaction.categoryId) || null : null,
        transactionDate: editingTransaction.transactionDate,
        paymentMethod: editingTransaction.paymentMethod,
        description: editingTransaction.description || ''
      });
      const updatedTitle = editingTransaction.title.trim();
      setEditingTransaction(null);
      await fetchTransactions();
      showNotification('success', `Transaction "${updatedTitle}" updated successfully.`);
    } catch (err) {
      setEditError(err.message || 'Unable to update this transaction.');
      showNotification('error', 'Failed to update transaction.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount) return;
    try {
      await transactionService.createIncome({
        title: incomeForm.title.trim(),
        amount: parseFloat(incomeForm.amount),
        paymentMethod: incomeForm.paymentMethod,
        transactionDate: incomeForm.transactionDate
      });
      const loggedTitle = incomeForm.title.trim();
      setIsIncomeModalOpen(false);
      setIncomeForm({
        title: 'Monthly Salary',
        amount: '',
        paymentMethod: 'BANK_TRANSFER',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      await fetchTransactions();
      showNotification('success', `Income "${loggedTitle}" recorded successfully.`);
    } catch (err) {
      showNotification('error', 'Failed to record income: ' + (err.message || 'Unknown error'));
    }
  };

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('date'); // 'date' | 'amount' | 'title'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedCategory('');
    setSelectedPayment('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
      // Search query filter
      const matchSearch = searchTerm === '' ||
        (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Flow type filter (INCOME vs EXPENSE)
      const matchType = selectedType === 'ALL' || t.type === selectedType;

      // Category filter (only applies to expenses or categorized transactions)
      const tCatId = t.categoryId || t.category?.id;
      const matchCategory = !selectedCategory || (tCatId && String(tCatId) === String(selectedCategory));

      // Payment method filter
      const matchPayment = selectedPayment === 'ALL' || t.paymentMethod === selectedPayment;

      // Date range filter
      const tDate = t.transactionDate || t.expenseDate || '';
      const matchStartDate = !startDate || tDate >= startDate;
      const matchEndDate = !endDate || tDate <= endDate;

      return matchSearch && matchType && matchCategory && matchPayment && matchStartDate && matchEndDate;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const dateA = new Date(a.transactionDate || a.expenseDate || 0).getTime();
        const dateB = new Date(b.transactionDate || b.expenseDate || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'amount') {
        comparison = (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      } else if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, selectedPayment, startDate, endDate, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  // Automatically adjust currentPage if it exceeds totalPages due to filtering or record deletion
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Statistics Calculation: Inflow, Outflow, Net Balance
  const stats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    filteredTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'INCOME') {
        inflow += amt;
        incomeCount++;
      } else {
        outflow += amt;
        expenseCount++;
      }
    });

    const net = inflow - outflow;

    return {
      inflow,
      outflow,
      net,
      totalCount: filteredTransactions.length,
      incomeCount,
      expenseCount
    };
  }, [filteredTransactions]);

  // Helper to normalize and prettify category names (e.g. 'EDUCATION' -> 'Education', 'HOUSING_AND_BILLS' -> 'Housing & Bills')
  const formatCategoryName = (name) => {
    if (!name) return 'General';
    // If it's already mixed case with spaces (like "Housing & Bills" or "Education"), return clean
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

  // Helper to standardize payment labels (e.g. 'BANK_TRANSFER' -> 'Bank Transfer', 'CARD' -> 'Card', 'UPI' -> 'UPI')
  const formatPaymentMethod = (method) => {
    if (!method) return 'Card';
    const map = {
      BANK_TRANSFER: 'Bank Transfer',
      CARD: 'Card',
      UPI: 'UPI',
      CASH: 'Cash'
    };
    return map[method] || method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'transactionDate', label: 'Date', formatter: (i) => i.transactionDate || i.expenseDate },
      { key: 'type', label: 'Flow Type' },
      { key: 'title', label: 'Title / Description' },
      { key: 'categoryName', label: 'Category', formatter: (i) => i.type === 'INCOME' ? 'Salary / Income' : formatCategoryName(i.category?.name) },
      { key: 'paymentMethod', label: 'Payment Channel', formatter: (i) => formatPaymentMethod(i.paymentMethod) },
      { key: 'amount', label: 'Amount (₹)', formatter: (i) => parseFloat(i.amount || 0).toFixed(2) }
    ];
    exportToCSV(filteredTransactions, 'FinTrack_Transactions.csv', columns);
  };

  const handleExportJSON = () => {
    const formattedData = filteredTransactions.map(tx => ({
      ...tx,
      categoryName: tx.type === 'INCOME' ? 'Salary / Income' : formatCategoryName(tx.category?.name),
      formattedPaymentMethod: formatPaymentMethod(tx.paymentMethod)
    }));
    exportToJSON(formattedData, 'FinTrack_Transactions.json');
  };

  return (
    <div className="page-wrapper">
      {/* Toast Notification for CRUD feedback */}
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

      {/* Header & Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
            All Transactions
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            View and manage all your incoming salary deposits and outgoing expenses
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title={`Export all ${filteredTransactions.length} filtered records to CSV`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
          >
            <FileSpreadsheet size={15} color="#10B981" />
            <span>Export Filtered CSV ({filteredTransactions.length})</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="btn btn-secondary"
            title={`Export all ${filteredTransactions.length} filtered records to JSON`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
          >
            <FileCode size={15} color="#6366F1" />
            <span>Export JSON</span>
          </button>

          <button 
            onClick={() => setIsIncomeModalOpen(true)}
            className="btn btn-secondary"
            style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669', padding: '0.55rem 1rem' }}
          >
            <Plus size={15} />
            <span>Log Income</span>
          </button>

          <button 
            onClick={onNavigateAddExpense}
            className="btn btn-primary" 
            style={{ padding: '0.55rem 1.1rem' }}
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STATS RIBBON: Inflow, Outflow, Net Balance, Total Count */}
      <div className="stats-ribbon" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-item">
          <span className="stat-label">
            {selectedType === 'EXPENSE' ? 'Total Income (Filtered: None)' : 'Total Income (Filtered)'}
          </span>
          <span className="stat-value" style={{ color: '#10B981' }}>
            +{formatCurrency(stats.inflow)}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">
            {selectedType === 'INCOME' ? 'Total Expenses (Filtered: None)' : 'Total Expenses (Filtered)'}
          </span>
          <span className="stat-value" style={{ color: '#0F172A' }}>
            -{formatCurrency(stats.outflow)}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Net Balance (Filtered)</span>
          <span className="stat-value" style={{ color: stats.net >= 0 ? '#10B981' : '#DC2626' }}>
            {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Total Records (Filtered)</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>
            {stats.totalCount} records <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>({stats.incomeCount} In • {stats.expenseCount} Out)</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Flow Type Filter */}
          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All (Income & Expenses)</option>
            <option value="INCOME">Income Only (+)</option>
            <option value="EXPENSE">Expenses Only (-)</option>
          </select>

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

          {/* Payment Method Filter */}
          <select
            className="form-select"
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CARD">Card (Credit/Debit)</option>
            <option value="UPI">UPI / Digital Wallet</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
          </select>
        </div>

        {/* Date Presets Row & Reset Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginRight: '0.35rem' }}>
              Period:
            </span>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_30', label: 'Last 30 Days' },
              { id: 'THIS_YEAR', label: 'This Year' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyDatePreset(p.id)}
                className={`pill-btn ${datePreset === p.id ? 'active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={resetFilters}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: '#64748B' }}
          >
            <X size={13} style={{ marginRight: '4px' }} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading transaction records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Receipt size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Transactions Found
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
              No inflows or outflows matched your active search and filter criteria.
            </p>
            <button
              onClick={resetFilters}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem', padding: '0.45rem 1rem', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <X size={14} />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th 
                      style={{ padding: '1rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}
                      onClick={() => handleSort('title')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Title & Description
                        <ArrowUpDown size={12} color={sortField === 'title' ? '#0F172A' : '#94A3B8'} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Category / Flow</th>
                    <th 
                      style={{ padding: '1rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}
                      onClick={() => handleSort('date')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Date
                        <ArrowUpDown size={12} color={sortField === 'date' ? '#0F172A' : '#94A3B8'} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Channel</th>
                    <th 
                      style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => handleSort('amount')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        Amount
                        <ArrowUpDown size={12} color={sortField === 'amount' ? '#0F172A' : '#94A3B8'} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Receipt</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    const catName = isIncome ? 'Salary / Income' : formatCategoryName(tx.category?.name);
                    const catColor = tx.category?.colorCode || (isIncome ? '#10B981' : '#64748B');
                    const paymentLabel = formatPaymentMethod(tx.paymentMethod);

                    return (
                      <tr 
                        key={tx.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'var(--transition)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{tx.title}</div>
                          {tx.description && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                              {tx.description}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              background: isIncome ? '#ECFDF5' : '#F1F5F9', 
                              color: isIncome ? '#059669' : '#334155', 
                              borderColor: isIncome ? '#A7F3D0' : '#E2E8F0',
                              fontSize: '0.725rem'
                            }}
                          >
                            <Tag size={11} color={catColor} />
                            {catName}
                          </span>
                        </td>

                        <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>
                          {formatDate(tx.transactionDate || tx.expenseDate)}
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#334155'
                          }}>
                            {paymentLabel}
                          </span>
                        </td>

                        <td style={{ 
                          padding: '1rem 1.25rem', 
                          textAlign: 'right', 
                          fontWeight: '800', 
                          fontSize: '0.95rem',
                          color: isIncome ? '#10B981' : '#0F172A' 
                        }}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          {tx.receiptUrl ? (
                            <button
                              onClick={() => setSelectedReceiptTx(tx)}
                              className="btn btn-secondary btn-icon"
                              title="View & Download Receipt Attachment"
                              style={{ padding: '0.35rem', color: '#10B981', borderColor: '#A7F3D0' }}
                            >
                              <Paperclip size={14} />
                            </button>
                          ) : (
                            <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }} title="No receipt attached">—</span>
                          )}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button
                            onClick={() => openEditModal(tx)}
                            className="btn btn-secondary btn-icon"
                            title={`Edit "${tx.title}"`}
                            style={{ color: '#4F46E5', borderColor: '#C7D2FE', padding: '0.35rem', marginRight: '0.35rem' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id, tx.title)}
                            className="btn btn-secondary btn-icon"
                            title={`Delete "${tx.title}"`}
                            style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.35rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
                  Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredTransactions.length)}</strong> to <strong>{Math.min(currentPage * pageSize, filteredTransactions.length)}</strong> of <strong>{filteredTransactions.length}</strong> transactions
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B' }}>
                    <span>Rows:</span>
                    <select
                      className="form-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: 'auto', width: 'auto' }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Prev
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#0F172A' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Salary Log Modal */}
      <Modal isOpen={Boolean(editingTransaction)} onClose={() => setEditingTransaction(null)} title="Edit Transaction">
        <form onSubmit={handleEditSubmit}>
          {editError && <div className="form-error" style={{ marginBottom: '1rem' }}>{editError}</div>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={editingTransaction?.title || ''} onChange={e => setEditingTransaction(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" min="0.01" step="0.01" required value={editingTransaction?.amount || ''} onChange={e => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" required value={editingTransaction?.transactionDate || ''} onChange={e => setEditingTransaction(prev => ({ ...prev, transactionDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={editingTransaction?.paymentMethod || 'CARD'} onChange={e => setEditingTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                <option value="CARD">Card</option>
                <option value="UPI">UPI / Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>
          {editingTransaction?.type === 'EXPENSE' && (
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={editingTransaction.categoryId || ''} onChange={e => setEditingTransaction(prev => ({ ...prev, categoryId: e.target.value }))}>
                <option value="">General</option>
                {categories.map(category => <option key={category.id} value={category.id}>{formatCategoryName(category.name)}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="3" value={editingTransaction?.description || ''} onChange={e => setEditingTransaction(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingTransaction(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Quick Salary Log Modal */}
      <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Log Monthly Salary & Inflows">
        <form onSubmit={handleCreateIncome}>
          <div className="form-group">
            <label className="form-label">Income Source / Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={incomeForm.title}
              onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
              placeholder="e.g. Monthly Salary - September 2026"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Inflow Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="form-input"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              placeholder="e.g. 75000"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={incomeForm.transactionDate}
                onChange={(e) => setIncomeForm({ ...incomeForm, transactionDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Channel</label>
              <select
                className="form-select"
                value={incomeForm.paymentMethod}
                onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
              >
                <option value="BANK_TRANSFER">Direct Deposit / Wire</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="CARD">Debit Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsIncomeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Inflow
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview & Download Modal */}
      {selectedReceiptTx && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedReceiptTx(null)}
          title={`Receipt Document: ${selectedReceiptTx.title}`}
        >
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              background: '#F8FAFC',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              marginBottom: '1rem'
            }}>
              <img 
                src={selectedReceiptTx.receiptUrl} 
                alt="Receipt Attachment" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '55vh', 
                  objectFit: 'contain', 
                  borderRadius: '6px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.85rem', 
              color: '#64748B',
              padding: '0.5rem 0.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                Amount: <strong style={{ color: '#0F172A' }}>{formatCurrency(selectedReceiptTx.amount)}</strong> • Date: <strong>{formatDate(selectedReceiptTx.transactionDate || selectedReceiptTx.expenseDate)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={selectedReceiptTx.receiptUrl}
                  download={`FinTrack_Receipt_${selectedReceiptTx.id || 'attachment'}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                >
                  Download Receipt
                </a>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  onClick={() => setSelectedReceiptTx(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
