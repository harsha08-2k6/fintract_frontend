import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { notificationService } from '../services/notificationService';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Search, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Pencil,
  Building2, 
  ArrowDownRight,
  Briefcase,
  Layers,
  FileCode,
  FileSpreadsheet,
  Repeat,
  CheckCircle,
  AlertCircle,
  X,
  PieChart,
  Award,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export const Income = () => {
  const [allIncome, setAllIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL'); // 'ALL' | 'SALARY' | 'BONUS' | 'FREELANCE' | 'INVESTMENT' | 'OTHER'

  // Notification feedback state
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Human-readable payment label mapping
  const formatPaymentMethod = (method) => {
    if (!method) return 'Bank Transfer';
    const map = {
      BANK_TRANSFER: 'Bank Transfer',
      CARD: 'Debit Card',
      UPI: 'UPI / Wallet',
      CASH: 'Cash'
    };
    return map[method] || method;
  };

  // Standard Income Sources Definition
  const INCOME_SOURCES = [
    { id: 'SALARY', label: 'Primary Salary', color: '#10B981' },
    { id: 'BONUS', label: 'Bonuses & Incentives', color: '#6366F1' },
    { id: 'FREELANCE', label: 'Freelancing & Consulting', color: '#F59E0B' },
    { id: 'INVESTMENT', label: 'Investments & Dividends', color: '#3B82F6' },
    { id: 'OTHER', label: 'Other Inflows', color: '#64748B' }
  ];

  // Helper to determine or read income source category
  const getItemSourceCategory = (item) => {
    if (item.sourceCategory) return item.sourceCategory;
    const titleLower = (item.title || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    if (titleLower.includes('bonus') || descLower.includes('bonus') || titleLower.includes('incentive')) return 'BONUS';
    if (titleLower.includes('salary') || descLower.includes('salary') || titleLower.includes('payroll')) return 'SALARY';
    if (titleLower.includes('freelance') || descLower.includes('freelance') || titleLower.includes('consulting') || titleLower.includes('client')) return 'FREELANCE';
    if (titleLower.includes('dividend') || descLower.includes('dividend') || titleLower.includes('interest') || titleLower.includes('investment') || titleLower.includes('stock')) return 'INVESTMENT';
    return 'OTHER';
  };

  // Add Income Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    sourceCategory: 'SALARY',
    paymentMethod: 'BANK_TRANSFER',
    transactionDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    frequency: 'MONTHLY',
    recurringMonths: 12
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Recurring Salary Manager Modal State
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    title: 'Monthly Salary',
    amount: '65000',
    sourceCategory: 'SALARY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', // optional cut-off date
    frequency: 'MONTHLY',
    numberOfMonths: 6,
    paymentMethod: 'BANK_TRANSFER',
    description: 'Corporate payroll auto-entry'
  });

  const fetchIncome = async () => {
    setLoading(true);
    try {
      // Fetch all income records unconditionally so client-side period filtering is 100% reliable and instantaneous
      const data = await transactionService.getIncome();
      const list = Array.isArray(data) ? data : (data?.content || []);
      setAllIncome(list);
    } catch (err) {
      console.error('Error fetching income records:', err);
      showNotification('error', 'Unable to fetch income records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
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

  // Period-filtered list (strictly by date presets, custom dates, and search terms)
  // Used for summary statistics, monthly average, and the Income Sources Breakdown
  const periodFilteredList = useMemo(() => {
    return allIncome.filter(item => {
      // Date filter
      const itemDate = item.transactionDate || item.expenseDate || '';
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;

      // Search query filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.title && item.title.toLowerCase().includes(query);
        const matchDesc = item.description && item.description.toLowerCase().includes(query);
        const matchMethod = item.paymentMethod && item.paymentMethod.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchMethod) return false;
      }

      return true;
    });
  }, [allIncome, startDate, endDate, searchTerm]);

  // Income Metrics strictly calculated from periodFilteredList
  const metrics = useMemo(() => {
    const total = periodFilteredList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const count = periodFilteredList.length;
    const peak = periodFilteredList.reduce((m, item) => Math.max(m, parseFloat(item.amount) || 0), 0);

    // Calculate genuine Monthly Average: total income divided by distinct calendar months represented in the current filtered set
    const distinctMonths = new Set(
      periodFilteredList.map(item => (item.transactionDate || item.expenseDate || '').slice(0, 7)).filter(Boolean)
    );
    const monthDivisor = Math.max(1, distinctMonths.size);
    const monthlyAverage = total / monthDivisor;

    // Income Sources Breakdown (Salary, Bonuses, Freelancing, Investments, Other)
    const sources = {
      SALARY: { id: 'SALARY', label: 'Primary Salary', amount: 0, count: 0, color: '#10B981' },
      BONUS: { id: 'BONUS', label: 'Bonuses & Incentives', amount: 0, count: 0, color: '#6366F1' },
      FREELANCE: { id: 'FREELANCE', label: 'Freelancing & Consulting', amount: 0, count: 0, color: '#F59E0B' },
      INVESTMENT: { id: 'INVESTMENT', label: 'Investments & Dividends', amount: 0, count: 0, color: '#3B82F6' },
      OTHER: { id: 'OTHER', label: 'Other Inflows', amount: 0, count: 0, color: '#64748B' }
    };

    periodFilteredList.forEach(item => {
      const cat = getItemSourceCategory(item);
      const amt = parseFloat(item.amount) || 0;
      if (sources[cat]) {
        sources[cat].amount += amt;
        sources[cat].count++;
      } else {
        sources.OTHER.amount += amt;
        sources.OTHER.count++;
      }
    });

    const sourcesList = Object.values(sources).filter(s => s.amount > 0 || s.count > 0);

    return {
      total,
      count,
      peak,
      monthlyAverage,
      monthCount: monthDivisor,
      sourcesList
    };
  }, [periodFilteredList]);

  // Visible items in the table & export (periodFilteredList + optional selectedSource filter)
  const visibleList = useMemo(() => {
    if (selectedSource === 'ALL') return periodFilteredList;
    return periodFilteredList.filter(item => getItemSourceCategory(item) === selectedSource);
  }, [periodFilteredList, selectedSource]);

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.amount || Number(formData.amount) <= 0) {
      alert('Please provide a valid title and positive amount.');
      return;
    }
    setSubmitting(true);
    try {
      const baseDate = new Date(formData.transactionDate);
      const isRecurring = formData.isRecurring;
      const count = isRecurring ? Math.max(1, parseInt(formData.recurringMonths) || 1) : 1;

      for (let i = 0; i < count; i++) {
        const txDate = new Date(baseDate);
        txDate.setMonth(baseDate.getMonth() + i);
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, '0');
        const dd = String(txDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const entryTitle = isRecurring && count > 1 
          ? `${formData.title.trim()} (${txDate.toLocaleString('default', { month: 'short' })} ${yyyy})`
          : formData.title.trim();

        await transactionService.createIncome({
          title: entryTitle,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          sourceCategory: formData.sourceCategory,
          paymentMethod: formData.paymentMethod,
          transactionDate: dateStr
        });
      }

      setIsModalOpen(false);
      const loggedAmount = parseFloat(formData.amount);
      const titleClean = formData.title.trim();

      notificationService.createNotification({
        title: 'Income recorded successfully',
        message: `${formatCurrency(loggedAmount)} deposited (${titleClean}).`,
        category: 'TRANSACTION',
        severity: 'SUCCESS',
        actionUrl: 'income',
        metadata: { title: titleClean, amount: loggedAmount, sourceCategory: formData.sourceCategory }
      });

      setFormData({
        title: '',
        description: '',
        amount: '',
        sourceCategory: 'SALARY',
        paymentMethod: 'BANK_TRANSFER',
        transactionDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'MONTHLY',
        recurringMonths: 12
      });
      await fetchIncome();
      showNotification('success', isRecurring ? `Generated ${count} recurring income schedules.` : `Income "${titleClean}" logged successfully.`);
    } catch (err) {
      showNotification('error', 'Failed to record income: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRecurringSalary = async (e) => {
    e.preventDefault();
    if (!recurringForm.title?.trim() || !recurringForm.amount || Number(recurringForm.amount) <= 0) {
      alert('Please provide a valid title and positive salary amount.');
      return;
    }
    setSubmitting(true);
    try {
      const baseDate = new Date(recurringForm.startDate);
      const months = Math.min(24, Math.max(1, parseInt(recurringForm.numberOfMonths) || 6));
      let createdCount = 0;

      for (let i = 0; i < months; i++) {
        const targetDate = new Date(baseDate);
        targetDate.setMonth(baseDate.getMonth() + i);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // Stop generation if past user's optional end date
        if (recurringForm.endDate && dateStr > recurringForm.endDate) {
          break;
        }

        // Deduplication check: prevent duplicate salary for the exact same title & date
        const isDuplicate = allIncome.some(existing => 
          existing.title?.toLowerCase() === recurringForm.title.trim().toLowerCase() &&
          (existing.transactionDate || existing.expenseDate) === dateStr
        );

        if (!isDuplicate) {
          await transactionService.createIncome({
            title: recurringForm.title.trim(),
            description: `${recurringForm.description} - Month ${i + 1} of ${months}`,
            amount: parseFloat(recurringForm.amount),
            sourceCategory: recurringForm.sourceCategory || 'SALARY',
            paymentMethod: recurringForm.paymentMethod,
            transactionDate: dateStr
          });
          createdCount++;
        }
      }

      setIsRecurringModalOpen(false);
      await fetchIncome();
      showNotification('success', `Generated ${createdCount} monthly salary entries (skipped existing duplicates).`);
    } catch (err) {
      showNotification('error', 'Failed to setup recurring salary: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem?.title?.trim() || !editingItem?.amount || Number(editingItem.amount) <= 0) return;
    setSavingEdit(true);
    try {
      await transactionService.updateTransaction(editingItem.id, {
        type: 'INCOME',
        title: editingItem.title.trim(),
        amount: parseFloat(editingItem.amount),
        sourceCategory: editingItem.sourceCategory,
        paymentMethod: editingItem.paymentMethod,
        transactionDate: editingItem.transactionDate,
        description: editingItem.description || ''
      });
      const updatedTitle = editingItem.title.trim();
      setEditingItem(null);
      await fetchIncome();
      showNotification('success', `Income entry "${updatedTitle}" updated successfully.`);
    } catch (err) {
      showNotification('error', 'Failed to update income record: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditModal = (item) => {
    setEditingItem({
      ...item,
      sourceCategory: getItemSourceCategory(item),
      transactionDate: item.transactionDate || item.expenseDate || new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async (id, title) => {
    const recordLabel = title ? `"${title}"` : 'this income entry';
    if (window.confirm(`Are you sure you want to delete ${recordLabel}? This action cannot be undone.`)) {
      try {
        await transactionService.deleteTransaction(id);
        await fetchIncome();
        showNotification('success', `Income entry ${recordLabel} deleted.`);
      } catch (err) {
        showNotification('error', 'Failed to delete income: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // Preset Shortcuts
  const setPresetIncome = (title, defaultAmt, category = 'SALARY') => {
    setFormData(prev => ({
      ...prev,
      title,
      sourceCategory: category,
      amount: defaultAmt ? String(defaultAmt) : prev.amount
    }));
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'transactionDate', label: 'Date', formatter: (i) => i.transactionDate || i.expenseDate },
      { key: 'title', label: 'Income Source / Title' },
      { key: 'sourceCategory', label: 'Source Classification', formatter: (i) => {
        const match = INCOME_SOURCES.find(s => s.id === getItemSourceCategory(i));
        return match ? match.label : 'Other';
      }},
      { key: 'amount', label: 'Amount (₹)', formatter: (i) => parseFloat(i.amount || 0).toFixed(2) },
      { key: 'paymentMethod', label: 'Payment Method (Raw)' },
      { key: 'readableChannel', label: 'Payment Channel', formatter: (i) => formatPaymentMethod(i.paymentMethod) },
      { key: 'description', label: 'Notes & Description', formatter: (i) => i.description || '' }
    ];
    exportToCSV(visibleList, `FinTrack_Income_${datePreset}.csv`, columns);
  };

  const handleExportJSON = () => {
    const formattedData = visibleList.map(item => ({
      id: item.id,
      title: item.title,
      sourceCategory: getItemSourceCategory(item),
      sourceCategoryLabel: INCOME_SOURCES.find(s => s.id === getItemSourceCategory(item))?.label || 'Other Inflows',
      amount: parseFloat(item.amount || 0),
      transactionDate: item.transactionDate || item.expenseDate,
      paymentMethod: item.paymentMethod,
      paymentMethodLabel: formatPaymentMethod(item.paymentMethod),
      description: item.description || ''
    }));
    exportToJSON(formattedData, `FinTrack_Income_${datePreset}.json`);
  };

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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Income & Salary Ledger
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Track monthly salary, freelancing, investment inflows, and recurring earnings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title={`Export all ${visibleList.length} filtered income records to CSV`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
          >
            <FileSpreadsheet size={15} color="#10B981" />
            <span>CSV ({visibleList.length})</span>
          </button>

          <button 
            onClick={handleExportJSON}
            className="btn btn-secondary"
            title={`Export all ${visibleList.length} filtered income records to JSON`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
          >
            <FileCode size={15} color="#6366F1" />
            <span>JSON</span>
          </button>

          <button 
            onClick={() => setIsRecurringModalOpen(true)}
            className="btn btn-secondary"
            title="Setup recurring monthly salary schedules"
            style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
          >
            <Repeat size={15} />
            <span>Setup Recurring</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.15rem' }}
          >
            <Plus size={16} />
            <span>Log Salary / Income</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Ribbon (Updates dynamically with period filters) */}
      <div className="stats-ribbon" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-item">
          <span className="stat-label">Total Inflow ({datePreset === 'ALL' ? 'All Time' : datePreset === 'THIS_MONTH' ? 'This Month' : datePreset === 'LAST_30' ? 'Last 30 Days' : 'This Year'})</span>
          <span className="stat-value" style={{ color: '#10B981' }}>
            +{formatCurrency(metrics.total)}
          </span>
        </div>

        <div className="stat-item" title="Calculated as total inflow divided by distinct calendar months with recorded income in the active period.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Monthly Average</span>
            <span style={{ fontSize: '0.72rem', color: '#64748B', background: '#F1F5F9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              {metrics.monthCount} {metrics.monthCount === 1 ? 'active mo' : 'active mos'}
            </span>
          </div>
          <span className="stat-value" style={{ color: '#0F172A' }}>
            {formatCurrency(metrics.monthlyAverage)}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Across {metrics.monthCount} distinct calendar {metrics.monthCount === 1 ? 'month' : 'months'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Income Records</span>
          <span className="stat-value" style={{ fontSize: '1.25rem' }}>
            {metrics.count} {metrics.count === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Peak Inflow</span>
          <span className="stat-value" style={{ color: '#10B981' }}>
            {formatCurrency(metrics.peak)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search salary, client, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
        </div>
      </div>

      {/* Income Sources Breakdown Section */}
      {metrics.sourcesList && metrics.sourcesList.length > 0 && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#10B981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                Income Sources Breakdown
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {selectedSource !== 'ALL' && (
                <button
                  onClick={() => setSelectedSource('ALL')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.725rem', padding: '0.2rem 0.55rem', color: '#64748B' }}
                >
                  <X size={12} style={{ marginRight: '3px' }} />
                  Show All Sources
                </button>
              )}
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {metrics.count} entries in selected period
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            {metrics.sourcesList.map(src => {
              const isSelected = selectedSource === src.id;
              const percentage = metrics.total > 0 ? ((src.amount / metrics.total) * 100).toFixed(1) : '0';
              return (
                <div 
                  key={src.id}
                  onClick={() => setSelectedSource(prev => prev === src.id ? 'ALL' : src.id)}
                  title={`Click to filter ledger by ${src.label}`}
                  style={{
                    background: isSelected ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${isSelected ? '#10B981' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: '600', color: isSelected ? '#047857' : '#334155' }}>
                      {src.label}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: isSelected ? '#DCFCE7' : '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0'
                    }}>
                      {percentage}%
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>
                      {formatCurrency(src.amount)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isSelected ? '#059669' : '#64748B', marginTop: '2px', fontWeight: isSelected ? '600' : '400' }}>
                      {src.count} {src.count === 1 ? 'transaction' : 'transactions'} {isSelected ? '• Filter active' : ''}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: src.color,
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Income Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading income records...</p>
          </div>
        ) : visibleList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Wallet size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Income Records Found
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
              {selectedSource !== 'ALL' 
                ? `No entries matched source "${INCOME_SOURCES.find(s => s.id === selectedSource)?.label}" in the selected period.`
                : 'No salary deposits or inflows matched your selected period or search criteria.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {selectedSource !== 'ALL' && (
                <button onClick={() => setSelectedSource('ALL')} className="btn btn-secondary" style={{ fontSize: '0.825rem' }}>
                  Clear Source Filter
                </button>
              )}
              <button onClick={() => { applyDatePreset('ALL'); setSelectedSource('ALL'); }} className="btn btn-secondary" style={{ fontSize: '0.825rem' }}>
                Reset to All Time
              </button>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ fontSize: '0.825rem' }}>
                <Plus size={15} />
                <span>Log New Income</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Source & Title</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Classification</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Channel</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleList.map((item) => {
                  const catId = getItemSourceCategory(item);
                  const catInfo = INCOME_SOURCES.find(s => s.id === catId) || { label: 'Other', color: '#64748B' };

                  return (
                    <tr 
                      key={item.id} 
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'var(--transition)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.title}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span 
                          className="badge" 
                          onClick={() => setSelectedSource(prev => prev === catId ? 'ALL' : catId)}
                          style={{ 
                            background: '#F8FAFC', 
                            color: catInfo.color, 
                            borderColor: '#E2E8F0', 
                            fontSize: '0.725rem',
                            cursor: 'pointer'
                          }}
                          title="Filter by this source classification"
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: catInfo.color, display: 'inline-block', marginRight: '4px' }}></span>
                          {catInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>
                        {formatDate(item.transactionDate || item.expenseDate)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0', fontSize: '0.725rem' }}>
                          {formatPaymentMethod(item.paymentMethod)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: '800', color: '#10B981', fontSize: '0.95rem' }}>
                        +{formatCurrency(item.amount)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn btn-icon btn-secondary"
                          title={`Edit "${item.title}"`}
                          style={{ color: '#4F46E5', borderColor: '#C7D2FE', padding: '0.35rem', marginRight: '0.35rem' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="btn btn-icon btn-secondary"
                          title={`Delete "${item.title}"`}
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
        )}
      </div>

      {/* Add Income Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Monthly Salary & Income">
        <form onSubmit={handleCreateIncome}>
          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Monthly Salary', defaultAmt: 75000 },
                { label: 'Freelance Payout', defaultAmt: 25000 },
                { label: 'Investment Dividend', defaultAmt: 5000 },
                { label: 'Annual Bonus', defaultAmt: 50000 }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPresetIncome(p.label, p.defaultAmt)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Income Title / Source *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Monthly Salary - September 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Source Classification *</label>
              <select
                className="form-select"
                value={formData.sourceCategory}
                onChange={(e) => setFormData({ ...formData, sourceCategory: e.target.value })}
              >
                {INCOME_SOURCES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              className="form-input"
              placeholder="e.g. 75000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Deposit Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Channel</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="BANK_TRANSFER">Direct Deposit / Wire</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="CARD">Debit Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Source Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Optional details (e.g., Company payroll, project milestone, tax deductions)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Recurring Inflow Toggle */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginTop: '1rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Repeat size={16} color="#10B981" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0F172A' }}>
                  Repeat As Recurring Salary / Inflow
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
              />
            </div>

            {formData.isRecurring && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1' }}>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Frequency</label>
                    <select
                      className="form-select"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    >
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Generate For (Months)</label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      className="form-input"
                      value={formData.recurringMonths}
                      onChange={(e) => setFormData({ ...formData, recurringMonths: e.target.value })}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : formData.isRecurring ? `Generate ${formData.recurringMonths} Entries` : 'Save Income Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dedicated Recurring Salary Schedule Manager Modal */}
      <Modal 
        isOpen={isRecurringModalOpen} 
        onClose={() => setIsRecurringModalOpen(false)} 
        title="Configure Recurring Monthly Salary"
      >
        <form onSubmit={handleCreateRecurringSalary}>
          <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.25rem' }}>
            Configure automatic recurring salary entries. FinTrack automatically performs deduplication so identical entries on the same date will not be duplicated.
          </p>

          <div className="form-group">
            <label className="form-label">Salary Designation / Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Monthly Salary"
              value={recurringForm.title}
              onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Inflow Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              className="form-input"
              value={recurringForm.amount}
              onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={recurringForm.frequency}
                onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
              >
                <option value="MONTHLY">Monthly (Once per month)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Schedule Duration</label>
              <select
                className="form-select"
                value={recurringForm.numberOfMonths}
                onChange={(e) => setRecurringForm({ ...recurringForm, numberOfMonths: e.target.value })}
              >
                <option value="3">Next 3 Months</option>
                <option value="6">Next 6 Months</option>
                <option value="12">Next 12 Months (1 Year)</option>
                <option value="24">Next 24 Months (2 Years)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={recurringForm.startDate}
                onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Optional End Date (Cutoff)</label>
              <input
                type="date"
                className="form-input"
                value={recurringForm.endDate}
                onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                placeholder="Leave blank for full duration"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Channel</label>
            <select
              className="form-select"
              value={recurringForm.paymentMethod}
              onChange={(e) => setRecurringForm({ ...recurringForm, paymentMethod: e.target.value })}
            >
              <option value="BANK_TRANSFER">Direct Deposit / Wire (Bank Transfer)</option>
              <option value="UPI">UPI / Digital Wallet</option>
              <option value="CARD">Debit Card</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Payroll Reference</label>
            <input
              type="text"
              className="form-input"
              value={recurringForm.description}
              onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
              placeholder="e.g. Standard monthly salary auto-schedule"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRecurringModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Generating...' : `Generate ${recurringForm.numberOfMonths} Monthly Entries`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Income Modal */}
      <Modal isOpen={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit Income Entry">
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Income Source / Title *</label>
              <input
                type="text"
                required
                className="form-input"
                value={editingItem?.title || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Source Classification *</label>
              <select
                className="form-select"
                value={editingItem?.sourceCategory || 'SALARY'}
                onChange={(e) => setEditingItem(prev => ({ ...prev, sourceCategory: e.target.value }))}
              >
                {INCOME_SOURCES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              className="form-input"
              value={editingItem?.amount || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Deposit Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={editingItem?.transactionDate || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, transactionDate: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Channel</label>
              <select
                className="form-select"
                value={editingItem?.paymentMethod || 'BANK_TRANSFER'}
                onChange={(e) => setEditingItem(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="BANK_TRANSFER">Direct Deposit / Wire</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="CARD">Debit Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Source Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={editingItem?.description || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="btn btn-primary"
            >
              {savingEdit ? 'Saving...' : 'Update Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
