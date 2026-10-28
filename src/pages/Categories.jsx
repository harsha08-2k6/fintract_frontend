import React, { useState, useEffect, useMemo } from 'react';
import { categoryService } from '../services/categoryService';
import { expenseService } from '../services/expenseService';
import { reportService } from '../services/reportService';
import { notificationService } from '../services/notificationService';
import { CategoryCard } from '../components/CategoryCard';
import { Modal } from '../components/Modal';
import {
  Plus,
  Tag,
  IndianRupee,
  Search,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Sparkles,
  Sliders,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export const Categories = ({ onNavigateExpenses }) => {
  const [categories, setCategories] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [inspectingCategory, setInspectingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [formError, setFormError] = useState('');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Explicit Month / Period Selector State (P0)
  // Default to current month key, e.g. "2026-10"
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey); // 'ALL' or 'YYYY-MM'

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    colorCode: '#10B981',
    budgetLimit: ''
  });

  const [isBulkBudgetModalOpen, setIsBulkBudgetModalOpen] = useState(false);
  const [bulkBudgetInputs, setBulkBudgetInputs] = useState({});
  const [savingBulkBudgets, setSavingBulkBudgets] = useState(false);
  const [bulkBudgetError, setBulkBudgetError] = useState('');

  const fetchCategoriesAndTransactions = async () => {
    setLoading(true);
    try {
      const [cats, exps] = await Promise.all([
        categoryService.getAllCategories().catch(() => []),
        expenseService.getExpenses({}).catch(() => [])
      ]);

      const catList = Array.isArray(cats) ? cats : (cats?.content || []);
      const rawExpList = Array.isArray(exps) ? exps : (exps?.content || []);
      const expList = rawExpList.filter(item => item.type !== 'INCOME');

      setCategories(catList);
      setAllExpenses(expList);
    } catch (err) {
      console.error('Error fetching categories and expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndTransactions();
  }, []);

  // Compute available months dynamically from transactions + current month
  const availableMonths = useMemo(() => {
    const monthSet = new Set([currentMonthKey]);
    allExpenses.forEach(exp => {
      const d = exp.expenseDate || exp.transactionDate || '';
      if (d.length >= 7) {
        monthSet.add(d.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [allExpenses, currentMonthKey]);

  // Format month label, e.g. "2026-10" -> "October 2026"
  const formatMonthName = (monthKey) => {
    if (monthKey === 'ALL') return 'All-Time';
    const date = new Date(`${monthKey}-01T00:00:00`);
    if (isNaN(date.getTime())) return monthKey;
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Compute spent amount per category based on selectedMonth
  const breakdownMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = 0; });

    allExpenses.forEach(exp => {
      const expDate = exp.expenseDate || exp.transactionDate || '';
      if (selectedMonth !== 'ALL' && !expDate.startsWith(selectedMonth)) {
        return;
      }
      const expCatId = exp.categoryId || exp.category?.id;
      // Match by ID or by name
      const matchedCat = categories.find(c => String(c.id) === String(expCatId) || 
        (exp.category?.name && exp.category.name.toLowerCase() === c.name.toLowerCase()));

      if (matchedCat) {
        const amt = parseFloat(exp.amount) || 0;
        map[matchedCat.id] = (map[matchedCat.id] || 0) + amt;
      }
    });

    return map;
  }, [categories, allExpenses, selectedMonth]);

  const handleOpenBulkBudgetModal = () => {
    const initial = {};
    categories.forEach(cat => {
      initial[cat.id] = (cat.budgetLimit && cat.budgetLimit > 0) ? cat.budgetLimit.toString() : '';
    });
    setBulkBudgetInputs(initial);
    setBulkBudgetError('');
    setIsBulkBudgetModalOpen(true);
  };

  const handleSaveBulkBudgets = async (e) => {
    e.preventDefault();
    setBulkBudgetError('');

    // Validate that no budget limits are negative
    for (const cat of categories) {
      const valStr = bulkBudgetInputs[cat.id];
      if (valStr !== undefined && valStr !== '') {
        const num = parseFloat(valStr);
        if (isNaN(num) || num < 0) {
          setBulkBudgetError(`Budget limit for "${cat.name}" cannot be negative or invalid.`);
          return;
        }
      }
    }

    setSavingBulkBudgets(true);
    try {
      await Promise.all(
        categories.map(cat => {
          const limitVal = parseFloat(bulkBudgetInputs[cat.id]) || 0;
          return categoryService.updateCategory(cat.id, {
            name: cat.name,
            description: cat.description || '',
            colorCode: cat.colorCode || '#10B981',
            budgetLimit: Math.max(0, limitVal),
            icon: cat.icon || 'tag'
          });
        })
      );
      setIsBulkBudgetModalOpen(false);
      await fetchCategoriesAndTransactions();
      showNotification('success', `Category budgets for ${formatMonthName(selectedMonth)} updated successfully.`);
    } catch (err) {
      setBulkBudgetError('Failed to save budgets: ' + err.message);
    } finally {
      setSavingBulkBudgets(false);
    }
  };

  const handleOpenEdit = (category) => {
    setFormError('');
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      colorCode: category.colorCode || '#10B981',
      budgetLimit: category.budgetLimit ? category.budgetLimit.toString() : ''
    });
  };

  const handleDelete = async (id) => {
    const target = categories.find(c => c.id === id);
    const categoryName = target?.name || 'Category';
    const spentOnCategory = breakdownMap[id] || 0;
    if (spentOnCategory > 0) {
      alert(`Cannot delete "${categoryName}" because it has active spending records (${formatCurrency(spentOnCategory)}). Please reassign or remove transactions first to prevent orphaned records.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      try {
        await categoryService.deleteCategory(id);
        await fetchCategoriesAndTransactions();
        showNotification('success', `Category "${categoryName}" deleted successfully.`);
      } catch (err) {
        showNotification('error', 'Could not delete category: ' + err.message);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    if (formData.budgetLimit !== '' && parseFloat(formData.budgetLimit) < 0) {
      setFormError('Monthly budget limit cannot be negative.');
      return;
    }

    try {
      const created = await categoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        colorCode: formData.colorCode,
        budgetLimit: formData.budgetLimit ? Math.max(0, parseFloat(formData.budgetLimit)) : 0,
        icon: 'tag'
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', colorCode: '#10B981', budgetLimit: '' });
      await fetchCategoriesAndTransactions();
      showNotification('success', `Category "${created?.name || formData.name}" created successfully.`);
    } catch (err) {
      setFormError(err.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    if (formData.budgetLimit !== '' && parseFloat(formData.budgetLimit) < 0) {
      setFormError('Monthly budget limit cannot be negative.');
      return;
    }

    try {
      await categoryService.updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        colorCode: formData.colorCode,
        budgetLimit: formData.budgetLimit ? Math.max(0, parseFloat(formData.budgetLimit)) : 0,
        icon: editingCategory.icon || 'tag'
      });
      const updatedName = formData.name.trim();
      const newLimit = formData.budgetLimit ? Math.max(0, parseFloat(formData.budgetLimit)) : 0;
      setEditingCategory(null);
      setFormData({ name: '', description: '', colorCode: '#10B981', budgetLimit: '' });
      await fetchCategoriesAndTransactions();
      showNotification('success', `Category "${updatedName}" updated successfully.`);

      // Budget threshold configuration notification
      notificationService.createNotification({
        title: `Budget limit updated for ${updatedName}`,
        message: `Monthly spending limit set to ${formatCurrency(newLimit)}. FinTrack will alert you at 80% and 100% capacity.`,
        category: 'BUDGET',
        severity: 'INFO',
        actionUrl: 'categories',
        metadata: { categoryId: editingCategory.id, categoryName: updatedName, limit: newLimit }
      });
    } catch (err) {
      setFormError(err.message || 'Failed to update category');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  // Overall Reconciled Budget Summary based on selected period
  const budgetSummary = useMemo(() => {
    const totalBudget = categories.reduce((sum, c) => sum + (parseFloat(c.budgetLimit) || 0), 0);
    const totalSpent = Object.values(breakdownMap).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const remaining = totalBudget - totalSpent;
    const countWithBudget = categories.filter(c => parseFloat(c.budgetLimit) > 0).length;

    return { totalBudget, totalSpent, remaining, countWithBudget };
  }, [categories, breakdownMap]);

  // Filtered transactions for the currently inspected category
  const inspectingTransactions = useMemo(() => {
    if (!inspectingCategory) return [];
    return allExpenses.filter(exp => {
      const expCatId = exp.categoryId || exp.category?.id;
      const matchesCat = String(expCatId) === String(inspectingCategory.id) ||
        (exp.category?.name && exp.category.name.toLowerCase() === inspectingCategory.name.toLowerCase());
      const expDate = exp.expenseDate || exp.transactionDate || '';
      const matchesMonth = selectedMonth === 'ALL' || expDate.startsWith(selectedMonth);
      return matchesCat && matchesMonth;
    });
  }, [inspectingCategory, allExpenses, selectedMonth]);

  const colorPresets = ['#10B981', '#059669', '#4F46E5', '#6366F1', '#F59E0B', '#DC2626', '#0284C7', '#64748B'];

  return (
    <div className="page-wrapper">
      {/* Feedback Notification Alert */}
      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          background: notification.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${notification.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
          color: notification.type === 'error' ? '#B91C1C' : '#15803D',
          fontSize: '0.9rem',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'currentColor',
              fontWeight: '700',
              padding: '0 0.25rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0F172A' }}>Categories & Budgets</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Set category budget limits, track spending progress, and customize tags
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenBulkBudgetModal}
            className="btn btn-secondary"
            title="Configure monthly limits across all categories"
          >
            <Sliders size={16} />
            <span>Monthly Limits</span>
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', description: '', colorCode: '#10B981', budgetLimit: '' });
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* EXPLICIT BUDGET PERIOD / MONTH SELECTOR (P0) */}
      <div className="card" style={{ padding: '1rem 1.4rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F0FDF4',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #BBF7D0'
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Budget Period
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {formatMonthName(selectedMonth)} Budget Reconciliation
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', marginRight: '0.2rem' }}>
              SELECT MONTH:
            </span>
            {availableMonths.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setSelectedMonth(mKey)}
                className={`pill-btn ${selectedMonth === mKey ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                {formatMonthName(mKey)}
              </button>
            ))}
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`pill-btn ${selectedMonth === 'ALL' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              All-Time Spending
            </button>
          </div>
        </div>
      </div>

      {/* Budget Capacity Ribbon */}
      <div className="stats-ribbon">
        <div className="stat-item">
          <span className="stat-label">Total Monthly Budget</span>
          <span className="stat-value" style={{ color: '#0F172A' }}>
            {formatCurrency(budgetSummary.totalBudget)}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Target caps across categories
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Spent ({formatMonthName(selectedMonth)})</span>
          <span className="stat-value" style={{ color: '#10B981' }}>
            {formatCurrency(budgetSummary.totalSpent)}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Actual expenses in {formatMonthName(selectedMonth)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Budget Remaining</span>
          <span className="stat-value" style={{ color: budgetSummary.remaining < 0 ? '#DC2626' : '#059669' }}>
            {formatCurrency(budgetSummary.remaining)}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {budgetSummary.remaining < 0 ? 'Exceeded monthly budget' : 'Available spending room'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Limits Defined</span>
          <span className="stat-value">
            {budgetSummary.countWithBudget} of {categories.length}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {categories.length - budgetSummary.countWithBudget === 0 ? 'All categories have limits' : `${categories.length - budgetSummary.countWithBudget} uncapped`}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
          Showing <strong>{filteredCategories.length}</strong> categories
        </span>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748B' }}>Loading categories...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              spent={breakdownMap[cat.id] || 0}
              onDelete={handleDelete}
              onEdit={handleOpenEdit}
              onSelect={(category) => setInspectingCategory(category)}
            />
          ))}
        </div>
      )}

      {/* Modal to Create Category */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setFormError(''); }} title="Create New Category">
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.9rem',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '0.82rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Subscriptions, Fitness, Investments"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Budget Limit (₹)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00 (Leave 0 for no limit)"
                value={formData.budgetLimit}
                onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                style={{ paddingLeft: '2.5rem' }}
              />
              <IndianRupee size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color Theme</label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorCode: c })}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: formData.colorCode === c ? '3px solid #0F172A' : '2px solid transparent',
                    cursor: 'pointer',
                    transform: formData.colorCode === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'var(--transition)'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="What belongs in this category..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal to Edit Category */}
      {editingCategory && (
        <Modal isOpen={!!editingCategory} onClose={() => { setEditingCategory(null); setFormError(''); }} title={`Edit: ${editingCategory.name}`}>
          <form onSubmit={handleUpdate}>
            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.9rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Budget Limit (₹)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.budgetLimit}
                  onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <IndianRupee size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color Theme</label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorCode: c })}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      border: formData.colorCode === c ? '3px solid #0F172A' : '2px solid transparent',
                      cursor: 'pointer',
                      transform: formData.colorCode === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'var(--transition)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { setEditingCategory(null); setFormError(''); }} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal to Set / Adjust Category Monthly Budgets */}
      <Modal isOpen={isBulkBudgetModalOpen} onClose={() => { setIsBulkBudgetModalOpen(false); setBulkBudgetError(''); }} title={`${formatMonthName(selectedMonth)} Monthly Category Budgets`}>
        <form onSubmit={handleSaveBulkBudgets}>
          {bulkBudgetError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.9rem',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '0.82rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} />
              <span>{bulkBudgetError}</span>
            </div>
          )}

          <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Set or adjust monthly spending targets for each category for {formatMonthName(selectedMonth)}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '55vh', overflowY: 'auto' }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.875rem' }}>{cat.name}</span>
                <div style={{ width: '150px' }}>
                  <input
                    type="number"
                    step="100"
                    placeholder="0.00"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    value={bulkBudgetInputs[cat.id] || ''}
                    onChange={(e) => setBulkBudgetInputs({ ...bulkBudgetInputs, [cat.id]: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBulkBudgetModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={savingBulkBudgets} className="btn btn-primary">
              {savingBulkBudgets ? 'Saving...' : 'Save Budgets'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interactive Category Drill-Down Inspection Modal (P1) */}
      {inspectingCategory && (
        <Modal
          isOpen={Boolean(inspectingCategory)}
          onClose={() => setInspectingCategory(null)}
          title={`${inspectingCategory.name} — ${formatMonthName(selectedMonth)} Transactions`}
        >
          <div>
            {/* Header Summary for the inspected category */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.1rem',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>
                  Total Spent in Period
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A' }}>
                  {formatCurrency(breakdownMap[inspectingCategory.id] || 0)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>
                  Monthly Budget Limit
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#334155' }}>
                  {parseFloat(inspectingCategory.budgetLimit) > 0 ? formatCurrency(inspectingCategory.budgetLimit) : 'Uncapped'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: '600', textTransform: 'uppercase' }}>
                  Matching Records
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#10B981' }}>
                  {inspectingTransactions.length} entries
                </span>
              </div>
            </div>

            {/* Transactions List */}
            {inspectingTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  No recorded expenses for <strong>{inspectingCategory.name}</strong> in {formatMonthName(selectedMonth)}.
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '45vh', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Title</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Channel</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectingTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                          {tx.expenseDate || tx.transactionDate}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0F172A' }}>
                          {tx.title}
                          {tx.description && <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '400' }}>{tx.description}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                          {tx.paymentMethod || 'CARD'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                          -{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                {onNavigateExpenses && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const catId = inspectingCategory.id;
                      let start = '';
                      let end = '';
                      if (selectedMonth !== 'ALL') {
                        start = `${selectedMonth}-01`;
                        // compute end date of month
                        const parts = selectedMonth.split('-');
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        const lastDay = new Date(y, m, 0).getDate();
                        end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
                      }
                      setInspectingCategory(null);
                      onNavigateExpenses(catId, start, end);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#0F172A',
                      fontWeight: '600'
                    }}
                  >
                    <ExternalLink size={15} color="#10B981" />
                    <span>View in Expense Tracker</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setInspectingCategory(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
