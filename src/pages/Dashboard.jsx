import React, { useState, useEffect, useMemo } from 'react';
import { MetricStatCard } from '../components/ReportCard';
import { StockMarketChart } from '../components/StockMarketChart';
import { Modal } from '../components/Modal';
import { reportService } from '../services/reportService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  ArrowUpRight, 
  RefreshCw,
  Wallet,
  CheckCircle2,
  PieChart,
  IndianRupee,
  Receipt,
  Plus,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Tag,
  Percent,
  PiggyBank,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const Dashboard = ({ onNavigateExpenses, onNavigateAddExpense, onNavigateIncome, onNavigateCategories }) => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allLoadedTransactions, setAllLoadedTransactions] = useState([]);
  const [recentTypeFilter, setRecentTypeFilter] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Quick Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeTitle, setIncomeTitle] = useState('Monthly Salary');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);

  // Quick Budget Setup Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState({});
  const [savingBudgets, setSavingBudgets] = useState(false);

  // Monthly Budget Review Prompt
  const currentMonthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [showMonthlyPrompt, setShowMonthlyPrompt] = useState(() => {
    try {
      const confirmedMonth = localStorage.getItem('fintrack_budget_confirmed_month');
      return confirmedMonth !== currentMonthKey;
    } catch {
      return false;
    }
  });

  const handleConfirmSameBudget = () => {
    try {
      localStorage.setItem('fintrack_budget_confirmed_month', currentMonthKey);
    } catch {}
    setShowMonthlyPrompt(false);
  };

  const fetchDashboardData = async () => {
    try {
      const [reportData, transactionsData, categoryData] = await Promise.all([
        reportService.getDashboardReport().catch(() => null),
        transactionService.getAllTransactions().catch(() => []),
        categoryService.getAllCategories().catch(() => [])
      ]);

      if (reportData) setReport(reportData);

      const txList = Array.isArray(transactionsData) 
        ? transactionsData 
        : (transactionsData && Array.isArray(transactionsData.content) ? transactionsData.content : []);
      setAllLoadedTransactions(txList);
      setRecentTransactions(txList.slice(0, 5));

      const catList = Array.isArray(categoryData) 
        ? categoryData 
        : (categoryData && Array.isArray(categoryData.content) ? categoryData.content : []);
      setCategories(catList);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const refreshInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleQuickSaveIncome = async (e) => {
    e.preventDefault();
    if (!incomeAmount || parseFloat(incomeAmount) <= 0) return;
    setSavingIncome(true);
    try {
      await transactionService.createIncome({
        title: incomeTitle.trim(),
        amount: parseFloat(incomeAmount),
        paymentMethod: 'BANK_TRANSFER',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      setIsIncomeModalOpen(false);
      setIncomeAmount('');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to log income: ' + err.message);
    } finally {
      setSavingIncome(false);
    }
  };

  const handleOpenBudgetModal = () => {
    const initial = {};
    categories.forEach(cat => {
      initial[cat.id] = (cat.budgetLimit && cat.budgetLimit > 0) ? cat.budgetLimit.toString() : '';
    });
    setBudgetInputs(initial);
    setIsBudgetModalOpen(true);
  };

  const handleBudgetChange = (catId, value) => {
    setBudgetInputs(prev => ({ ...prev, [catId]: value }));
  };

  const handleSaveAllBudgets = async (e) => {
    e.preventDefault();
    setSavingBudgets(true);
    try {
      await Promise.all(
        categories.map(cat => {
          const limitVal = parseFloat(budgetInputs[cat.id]) || 0;
          return categoryService.updateCategory(cat.id, {
            name: cat.name,
            description: cat.description || '',
            colorCode: cat.colorCode || '#10B981',
            budgetLimit: limitVal,
            icon: cat.icon || 'tag'
          });
        })
      );
      setIsBudgetModalOpen(false);
      try {
        localStorage.setItem('fintrack_budget_confirmed_month', currentMonthKey);
      } catch {}
      setShowMonthlyPrompt(false);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to save budgets: ' + err.message);
    } finally {
      setSavingBudgets(false);
    }
  };

  // Filter / Period state: 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR' | 'ALL'
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

  // Compute reconciled financials based on selectedPeriod
  // CRITICAL FINANCIAL RULE: Category budget limits are defined on a monthly cadence.
  // When 'ALL' is selected: Total Income, Total Expenses, and Net Cash Flow are cumulative all-time,
  // but Remaining Budget & Budget Usage are strictly evaluated against the CURRENT MONTH (or selected month).
  const financialMetrics = useMemo(() => {
    let income = 0;
    let spend = 0;
    const currentMonthSpend = report?.currentMonthSpend ?? 0;
    const currentMonthIncome = report?.currentMonthIncome ?? 0;

    if (selectedPeriod === 'THIS_MONTH') {
      income = currentMonthIncome;
      spend = currentMonthSpend;
    } else {
      // ALL-TIME default or fallback
      income = report?.totalIncomeAllTime ?? currentMonthIncome;
      spend = report?.totalSpendAllTime ?? currentMonthSpend;
    }

    const netCashFlow = income - spend;
    const totalBudget = categories.reduce((sum, cat) => sum + (cat.budgetLimit || 0), 0);
    
    // Monthly budget usage spending: for THIS_MONTH it's spend; for ALL, it's strictly currentMonthSpend
    const budgetMonthSpend = selectedPeriod === 'THIS_MONTH' ? spend : currentMonthSpend;
    const remainingBudget = totalBudget - budgetMonthSpend;
    const budgetUsedPercentage = totalBudget > 0 ? (budgetMonthSpend / totalBudget) * 100 : 0;
    const momChange = report?.monthOverMonthChangePercentage;

    return {
      income,
      spend,
      netCashFlow,
      totalBudget,
      remainingBudget,
      budgetMonthSpend,
      budgetUsedPercentage,
      momChange
    };
  }, [report, categories, selectedPeriod]);

  // Use current month category breakdown when available for monthly budget utilization
  const breakdowns = (selectedPeriod === 'THIS_MONTH' || report?.currentMonthCategoryBreakdowns?.length > 0)
    ? (report?.currentMonthCategoryBreakdowns?.length > 0 ? report.currentMonthCategoryBreakdowns : (report?.categoryBreakdowns || []))
    : (report?.categoryBreakdowns || []);
  const monthlyTrends = report?.monthlyTrends || [];

  // Filtered recent transactions (top 5 matching recentTypeFilter)
  const filteredRecentTransactions = useMemo(() => {
    let list = allLoadedTransactions.length > 0 ? allLoadedTransactions : recentTransactions;
    if (recentTypeFilter === 'INCOME') {
      list = list.filter(t => t.type === 'INCOME');
    } else if (recentTypeFilter === 'EXPENSE') {
      list = list.filter(t => t.type !== 'INCOME');
    }
    return list.slice(0, 5);
  }, [allLoadedTransactions, recentTransactions, recentTypeFilter]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem auto' }}></div>
        <p style={{ color: '#64748B', fontWeight: '500' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Top Banner & Quick Actions */}
      <div className="dashboard-heading" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="dashboard-kicker">
            <Activity size={13} /> Corporate Financial Expense & Analytics
            {lastUpdated && <span className="dashboard-sync-status">Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <h2>
            Financial Overview
          </h2>
          <p>
            Unified reconciliation for income, departmental expenses, and budget limits
          </p>
        </div>
        
        <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setSelectedPeriod('THIS_MONTH')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                background: selectedPeriod === 'THIS_MONTH' ? '#FFFFFF' : 'transparent',
                color: selectedPeriod === 'THIS_MONTH' ? '#0F172A' : '#64748B',
                boxShadow: selectedPeriod === 'THIS_MONTH' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('ALL')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                background: selectedPeriod === 'ALL' ? '#FFFFFF' : 'transparent',
                color: selectedPeriod === 'ALL' ? '#0F172A' : '#64748B',
                boxShadow: selectedPeriod === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All-Time
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary"
            title="Refresh Data"
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="btn btn-secondary"
            style={{ borderColor: '#A7F3D0', color: '#059669', background: '#ECFDF5' }}
          >
            <Plus size={15} />
            <span>Log Income</span>
          </button>

          <button
            onClick={onNavigateAddExpense}
            className="btn btn-primary"
          >
            <Plus size={15} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* MONTHLY BUDGET RE-CONFIRMATION & UPDATE BANNER */}
      {showMonthlyPrompt && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.1rem 1.4rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)',
          border: '1px solid #A7F3D0',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                {currentMonthLabel} Budget Review
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#475569', margin: '2px 0 0 0' }}>
                Your current monthly category budget totals <strong>{formatCurrency(financialMetrics.totalBudget)}</strong>. Would you like to continue with these limits for {currentMonthLabel} or adjust them?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handleConfirmSameBudget}
              className="btn btn-secondary"
              style={{
                fontSize: '0.825rem',
                padding: '0.45rem 0.95rem',
                background: '#FFFFFF',
                borderColor: '#10B981',
                color: '#059669',
                fontWeight: '700'
              }}
            >
              Continue Same Budget
            </button>
            <button
              onClick={handleOpenBudgetModal}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
            >
              Adjust Limits
            </button>
          </div>
        </div>
      )}

      {/* 5 CORE FINANCIAL PILLARS - BALANCED RESPONSIVE 3+2 LAYOUT WITH EQUAL HEIGHT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Row 1 - Card 1: Income (spans 2 of 6 columns = 1/3) */}
        <div style={{ gridColumn: 'span 2' }} className="metric-card-col">
          <MetricStatCard
            title={selectedPeriod === 'THIS_MONTH' ? "Monthly Income" : "Total Income (All-Time)"}
            value={financialMetrics.income}
            subtext={financialMetrics.income > 0 ? (selectedPeriod === 'THIS_MONTH' ? "Earned in current month" : "Cumulative logged income") : "No income recorded"}
            icon={Wallet}
            valueColor="#10B981"
            iconBg="#ECFDF5"
            iconColor="#10B981"
          />
        </div>

        {/* Row 1 - Card 2: Total Expenses (spans 2 of 6 columns = 1/3) */}
        <div style={{ gridColumn: 'span 2' }} className="metric-card-col">
          <MetricStatCard
            title={selectedPeriod === 'THIS_MONTH' ? "Monthly Expenses" : "Total Expenses (All-Time)"}
            value={financialMetrics.spend}
            change={selectedPeriod === 'THIS_MONTH' ? financialMetrics.momChange : undefined}
            changeLabel="vs previous month"
            subtext={selectedPeriod === 'THIS_MONTH' ? "Spent in current month" : "Cumulative total outflows"}
            icon={CreditCard}
            valueColor="#0F172A"
            iconBg="#F1F5F9"
            iconColor="#0F172A"
          />
        </div>

        {/* Row 1 - Card 3: Net Cash Flow (spans 2 of 6 columns = 1/3) */}
        <div style={{ gridColumn: 'span 2' }} className="metric-card-col">
          <MetricStatCard
            title="Net Cash Flow"
            value={financialMetrics.netCashFlow}
            subtext={financialMetrics.netCashFlow >= 0 ? "Positive cash surplus" : "Deficit (Outflow exceeds inflow)"}
            icon={financialMetrics.netCashFlow >= 0 ? TrendingUp : TrendingDown}
            valueColor={financialMetrics.netCashFlow >= 0 ? "#10B981" : "#DC2626"}
            iconBg={financialMetrics.netCashFlow >= 0 ? "#ECFDF5" : "#FEF2F2"}
            iconColor={financialMetrics.netCashFlow >= 0 ? "#10B981" : "#DC2626"}
          />
        </div>

        {/* Row 2 - Card 4: Total Allocated Budget (spans 3 of 6 columns = 1/2) */}
        <div style={{ gridColumn: 'span 3' }} className="metric-card-col-wide">
          <MetricStatCard
            title="Total Monthly Budget Limit"
            value={financialMetrics.totalBudget}
            subtext="Configured monthly spending ceiling across all categories"
            icon={Sliders}
            valueColor="#2563EB"
            iconBg="#EFF6FF"
            iconColor="#2563EB"
          />
        </div>

        {/* Row 2 - Card 5: Remaining Budget (spans 3 of 6 columns = 1/2) */}
        <div style={{ gridColumn: 'span 3' }} className="metric-card-col-wide">
          <MetricStatCard
            title="Remaining Monthly Budget"
            value={financialMetrics.remainingBudget}
            subtext={financialMetrics.remainingBudget >= 0 
              ? `Unspent out of ${formatCurrency(financialMetrics.totalBudget)} limit (₹${financialMetrics.budgetMonthSpend.toLocaleString('en-IN')} spent this month)`
              : `Over budget by ${formatCurrency(Math.abs(financialMetrics.remainingBudget))} (₹${financialMetrics.budgetMonthSpend.toLocaleString('en-IN')} spent this month)`}
            icon={financialMetrics.remainingBudget >= 0 ? ShieldCheck : TrendingDown}
            valueColor={financialMetrics.remainingBudget >= 0 ? "#10B981" : "#DC2626"}
            iconBg={financialMetrics.remainingBudget >= 0 ? "#ECFDF5" : "#FEF2F2"}
            iconColor={financialMetrics.remainingBudget >= 0 ? "#10B981" : "#DC2626"}
          />
        </div>
      </div>

      {/* Main Visuals Grid: Spending Trend & Category Share */}
      <div className="grid-2 dashboard-chart-grid">
        {/* Stock Market Area Chart */}
        <div className="card dashboard-panel">
          <StockMarketChart 
            data={monthlyTrends} 
            title="Monthly Spending Trend"
            subtext="Interactive timeline showing your monthly spending habits"
            height={180}
          />
        </div>

        {/* Category Budget & Spending Breakdown */}
        <div className="card dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>{currentMonthLabel} Category Spending</h3>
              <p>Budget progress for {currentMonthLabel} expenses</p>
            </div>
            <button 
              onClick={handleOpenBudgetModal}
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#0F172A',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Set Budgets
            </button>
          </div>

          {breakdowns.length === 0 ? (
            <div className="dashboard-empty-state">
              <p>
                No category expenses recorded for {currentMonthLabel}. Add an expense to see breakdown.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {breakdowns.slice(0, 5).map((cat) => (
                <div key={cat.categoryId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>{cat.categoryName}</span>
                    <span style={{ color: '#64748B' }}>
                      <strong style={{ color: '#0F172A' }}>{formatCurrency(cat.totalAmount)}</strong> ({cat.percentage?.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                        background: cat.overBudget ? '#DC2626' : (cat.colorCode || '#10B981')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="category-panel-summary">
            <span className="category-panel-summary-label">{currentMonthLabel} Budget Usage</span>
            <span className="category-panel-summary-value">
              {financialMetrics.totalBudget > 0 ? `${Math.min(100, Math.round(financialMetrics.budgetUsedPercentage))}%` : 'No budget set'}
            </span>
            <div className="category-panel-summary-track">
              <div
                className="category-panel-summary-fill"
                style={{ width: `${financialMetrics.totalBudget > 0 ? Math.min(100, Math.max(0, financialMetrics.budgetUsedPercentage)) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Stream */}
      <div className="card dashboard-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="dashboard-panel-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3>Recent Transactions</h3>
            <p>Latest income deposits and expenses (click any entry to view details)</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Quick Type Filter */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'INCOME', label: 'Income' },
                { id: 'EXPENSE', label: 'Expenses' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRecentTypeFilter(f.id)}
                  style={{
                    border: 'none',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: recentTypeFilter === f.id ? '#FFFFFF' : 'transparent',
                    color: recentTypeFilter === f.id ? '#0F172A' : '#64748B',
                    boxShadow: recentTypeFilter === f.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {onNavigateExpenses && (
              <button onClick={onNavigateExpenses} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {filteredRecentTransactions.length === 0 ? (
          <div className="dashboard-empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
              {recentTypeFilter === 'ALL' 
                ? 'No transactions yet. Click + Log Income or + Add Expense to get started.'
                : `No ${recentTypeFilter.toLowerCase()} records found.`}
            </p>
          </div>
        ) : (
          <div className="dashboard-transaction-list">
            {filteredRecentTransactions.map(tx => {
              const isIncome = tx.type === 'INCOME';
              const catColor = tx.category?.colorCode || (isIncome ? '#10B981' : '#64748B');
              return (
                <div 
                  key={tx.id} 
                  className="dashboard-transaction"
                  onClick={() => setSelectedDetailTx(tx)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  title="Click to view transaction details"
                >
                  <div className="dashboard-transaction-main">
                    <div 
                      className={`dashboard-transaction-icon ${isIncome ? 'income' : 'expense'}`}
                      style={{ background: isIncome ? '#ECFDF5' : `${catColor}15`, color: catColor }}
                    >
                      {isIncome ? <TrendingUp size={16} /> : <Tag size={16} />}
                    </div>
                    <div>
                      <div className="dashboard-transaction-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{tx.title}</span>
                      </div>
                      <div className="dashboard-transaction-date">
                        {formatDate(tx.transactionDate || tx.expenseDate)} • {tx.paymentMethod || 'CARD'}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-transaction-meta">
                    <div className={`dashboard-transaction-amount ${isIncome ? 'income' : ''}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <span className="badge" style={{
                      fontSize: '0.68rem',
                      background: isIncome ? '#ECFDF5' : '#F1F5F9',
                      color: isIncome ? '#059669' : '#334155',
                      borderColor: isIncome ? '#A7F3D0' : '#CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      {!isIncome && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: catColor }} />}
                      {isIncome ? 'INCOME' : (tx.category?.name || 'EXPENSE')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Quick Detail Modal */}
      {selectedDetailTx && (
        <Modal 
          isOpen={!!selectedDetailTx} 
          onClose={() => setSelectedDetailTx(null)} 
          title="Transaction Details"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: selectedDetailTx.type === 'INCOME' ? '#ECFDF5' : '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Amount</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: selectedDetailTx.type === 'INCOME' ? '#059669' : '#0F172A' }}>
                  {selectedDetailTx.type === 'INCOME' ? '+' : '-'}{formatCurrency(selectedDetailTx.amount)}
                </div>
              </div>
              <span className="badge" style={{
                background: selectedDetailTx.type === 'INCOME' ? '#D1FAE5' : '#E2E8F0',
                color: selectedDetailTx.type === 'INCOME' ? '#065F46' : '#1E293B',
                fontWeight: '700'
              }}>
                {selectedDetailTx.type || 'EXPENSE'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Title / Description</span>
                <strong style={{ color: '#0F172A' }}>{selectedDetailTx.title}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Category</span>
                <strong style={{ color: '#0F172A' }}>{selectedDetailTx.category?.name || (selectedDetailTx.type === 'INCOME' ? 'Salary & Inflow' : 'General')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Transaction Date</span>
                <strong style={{ color: '#0F172A' }}>{formatDate(selectedDetailTx.transactionDate || selectedDetailTx.expenseDate)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Payment Channel</span>
                <strong style={{ color: '#0F172A' }}>{selectedDetailTx.paymentMethod || 'CARD'}</strong>
              </div>

              {selectedDetailTx.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.25rem' }}>
                  <span style={{ color: '#64748B' }}>Notes</span>
                  <p style={{ margin: 0, color: '#334155', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    {selectedDetailTx.description}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setSelectedDetailTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Salary Log Modal */}
      <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Log Income or Salary">
        <form onSubmit={handleQuickSaveIncome}>
          <div className="form-group">
            <label className="form-label">Income Source / Title</label>
            <input
              type="text"
              required
              className="form-input"
              value={incomeTitle}
              onChange={(e) => setIncomeTitle(e.target.value)}
              placeholder="e.g. Monthly Salary, Freelance project"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="form-input"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="e.g. 75000"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsIncomeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={savingIncome} className="btn btn-primary">
              {savingIncome ? 'Saving...' : 'Save Income'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Budget Configuration Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set Category Monthly Budgets">
        <form onSubmit={handleSaveAllBudgets}>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Assign monthly spending limits to your categories to keep your expenses under control.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '55vh', overflowY: 'auto' }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '0.875rem' }}>{cat.name}</span>
                <div style={{ width: '150px' }}>
                  <input
                    type="number"
                    step="100"
                    placeholder="e.g. 5000"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    value={budgetInputs[cat.id] || ''}
                    onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={savingBudgets} className="btn btn-primary">
              {savingBudgets ? 'Saving...' : 'Save Budgets'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
