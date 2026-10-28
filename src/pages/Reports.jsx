import React, { useState, useEffect, useMemo } from 'react';
import { reportService } from '../services/reportService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { StockMarketChart } from '../components/StockMarketChart';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Search,
  ArrowUpDown,
  Layers,
  CreditCard,
  FileCheck,
  TrendingUp,
  Wallet,
  Receipt,
  Tag,
  PiggyBank,
  Percent
} from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Report Config State
  const [reportType, setReportType] = useState('executive'); // 'executive' | 'income_vs_expense' | 'budget_audit' | 'ledger'
  const [periodPreset, setPeriodPreset] = useState('CURRENT_MONTH'); // 'CURRENT_MONTH' | 'LAST_MONTH' | 'YTD' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadReportSuite = async () => {
      setLoading(true);
      try {
        const [dash, trs, brk, txs, cats] = await Promise.all([
          reportService.getDashboardReport().catch(() => null),
          reportService.getMonthlyTrends().catch(() => []),
          reportService.getCategoryBreakdown().catch(() => []),
          transactionService.getAllTransactions().catch(() => []),
          categoryService.getAllCategories().catch(() => [])
        ]);

        if (dash) setReportData(dash);
        if (Array.isArray(trs)) setTrends(trs);
        if (Array.isArray(brk)) setBreakdown(brk);
        if (Array.isArray(cats)) setCategories(cats);

        const list = Array.isArray(txs) ? txs : (txs?.content || []);
        setTransactions(list);
      } catch (err) {
        console.error('Error loading report suite:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReportSuite();
  }, []);

  // Filtered Transactions based on period preset & search
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (periodPreset === 'CURRENT_MONTH') {
      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      list = list.filter(e => (e.transactionDate || e.expenseDate || '').startsWith(monthPrefix));
    } else if (periodPreset === 'LAST_MONTH') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(e => (e.transactionDate || e.expenseDate || '').startsWith(lastMonthPrefix));
    } else if (periodPreset === 'YTD') {
      list = list.filter(e => (e.transactionDate || e.expenseDate || '').startsWith(`${currentYear}`));
    } else if (periodPreset === 'ALL') {
      // All-Time: No date filtering
    } else if (periodPreset === 'CUSTOM') {
      if (customStartDate) list = list.filter(e => (e.transactionDate || e.expenseDate || '') >= customStartDate);
      if (customEndDate) list = list.filter(e => (e.transactionDate || e.expenseDate || '') <= customEndDate);
    }

    if (selectedType !== 'ALL') {
      list = list.filter(e => e.type === selectedType);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, periodPreset, customStartDate, customEndDate, selectedType, searchQuery]);

  // Aggregate Totals for the filtered view
  const reportTotals = useMemo(() => {
    let totalIncome = 0;
    let totalOutflow = 0;

    filteredTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalOutflow += amt;
      }
    });

    const netSavings = totalIncome - totalOutflow;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const count = filteredTransactions.length;
    const avgTicket = count > 0 ? (totalIncome + totalOutflow) / count : 0;

    return {
      totalIncome,
      totalOutflow,
      netSavings,
      savingsRate,
      transactionCount: count,
      avgTicket
    };
  }, [filteredTransactions]);

  // Export Handlers
  const handleExportCSV = () => {
    if (reportType === 'budget_audit') {
      const columns = [
        { key: 'categoryName', label: 'Category Name' },
        { key: 'budgetLimit', label: 'Allocated Budget (₹)', formatter: (i) => parseFloat(i.budgetLimit || 0).toFixed(2) },
        { key: 'totalAmount', label: 'Actual Outflow (₹)', formatter: (i) => parseFloat(i.totalAmount || 0).toFixed(2) },
        { key: 'variance', label: 'Variance (₹)', formatter: (i) => (parseFloat(i.budgetLimit || 0) - parseFloat(i.totalAmount || 0)).toFixed(2) },
        { key: 'percentage', label: 'Utilization (%)', formatter: (i) => i.percentage ? `${parseFloat(i.percentage).toFixed(1)}%` : '0%' },
        { key: 'overBudget', label: 'Audit Status', formatter: (i) => i.overBudget ? 'THRESHOLD_BREACH' : 'COMPLIANT' }
      ];
      exportToCSV(breakdown, `FinTrack_Budget_Audit_${todayStr}.csv`, columns);
    } else {
      const columns = [
        { key: 'transactionDate', label: 'Date', formatter: (i) => i.transactionDate || i.expenseDate },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title / Description' },
        { key: 'categoryName', label: 'Category', formatter: (i) => i.category?.name || (i.type === 'INCOME' ? 'Salary/Inflow' : 'General') },
        { key: 'paymentMethod', label: 'Payment Channel' },
        { key: 'amount', label: 'Amount (₹)', formatter: (i) => parseFloat(i.amount || 0).toFixed(2) }
      ];
      exportToCSV(filteredTransactions, `FinTrack_Financial_Statement_${todayStr}.csv`, columns);
    }
  };

  const handleExportJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      generatedBy: user?.fullName || user?.username || 'FinTrack User',
      reportType,
      periodPreset,
      summary: reportTotals,
      breakdown,
      transactions: filteredTransactions
    };
    exportToJSON(payload, `FinTrack_Statement_Export_${todayStr}.json`);
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E2E8F0',
          borderTopColor: '#10B981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem auto'
        }}></div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A' }}>Generating Financial Statements...</h3>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Validating ledgers, compiling cashflows, and calculating net savings
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header & Export Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
              Financial Reports & Statements
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
              Summaries of your income, expenses, category budgets, and monthly savings
            </p>
          </div>
        </div>

        {/* Action Suite (Export & Print) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            title="Print Official Statement (PDF)"
          >
            <Printer size={15} color="#0F172A" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title="Export CSV"
          >
            <FileSpreadsheet size={15} color="#10B981" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="btn btn-secondary"
            title="Export JSON"
          >
            <Download size={15} color="#6366F1" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Report Mode Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E2E8F0',
        marginBottom: '1.5rem',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'executive', label: 'Financial Summary', icon: FileCheck },
          { id: 'income_vs_expense', label: 'Income vs. Expenses', icon: TrendingUp },
          { id: 'budget_audit', label: 'Budget Tracking', icon: ShieldCheck },
          { id: 'ledger', label: 'All Records List', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.1rem',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#10B981' : '#64748B',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #10B981' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Ribbon */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Period Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Time Period
            </label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'CURRENT_MONTH', label: 'This Month' },
                { id: 'LAST_MONTH', label: 'Last Month' },
                { id: 'YTD', label: 'This Year' },
                { id: 'ALL', label: 'All-Time' },
                { id: 'CUSTOM', label: 'Custom' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriodPreset(p.id)}
                  className={`pill-btn ${periodPreset === p.id ? 'active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {periodPreset === 'CUSTOM' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>to</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Flow Type
            </label>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All (Income + Expenses)</option>
              <option value="INCOME">Income & Salary Only</option>
              <option value="EXPENSE">Expenses Only</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Matrix */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.4rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Income</span>
            <Wallet size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10B981', lineHeight: 1.1 }}>
            +{formatCurrency(reportTotals.totalIncome)}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Expenses</span>
            <CreditCard size={16} color="#0F172A" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
            -{formatCurrency(reportTotals.totalOutflow)}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Saved</span>
            <PiggyBank size={16} color={reportTotals.netSavings >= 0 ? "#10B981" : "#DC2626"} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: reportTotals.netSavings >= 0 ? "#10B981" : "#DC2626", lineHeight: 1.1 }}>
            {formatCurrency(reportTotals.netSavings)}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Savings Rate</span>
            <Percent size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: reportTotals.savingsRate >= 20 ? "#10B981" : "#0F172A", lineHeight: 1.1 }}>
            {reportTotals.savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* REPORT VIEW 1: FINANCIAL SUMMARY */}
      {reportType === 'executive' && (
        <div className="card" style={{ padding: '2rem', background: '#FFFFFF', marginBottom: '2rem' }}>
          <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A' }}>
                Monthly Financial Summary
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Period: <strong>{periodPreset === 'CURRENT_MONTH' ? 'This Month' : periodPreset === 'LAST_MONTH' ? 'Last Month' : periodPreset === 'YTD' ? 'This Year' : periodPreset === 'ALL' ? 'All-Time' : 'Custom Range'}</strong> • Generated for <strong>{user?.fullName || user?.username || 'User'}</strong>
              </p>
            </div>
            <span className="badge" style={{ background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }}>Summary Statement</span>
          </div>

          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.75rem' }}>
                Cashflow Summary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Total Income (Salary & Deposits)</span>
                  <strong style={{ color: '#10B981' }}>+{formatCurrency(reportTotals.totalIncome)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Total Expenses (Daily Spending)</span>
                  <strong style={{ color: '#0F172A' }}>-{formatCurrency(reportTotals.totalOutflow)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  <span style={{ fontWeight: '700', color: '#047857' }}>Net Money Saved</span>
                  <strong style={{ fontWeight: '800', color: '#047857' }}>{formatCurrency(reportTotals.netSavings)}</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.75rem' }}>
                Financial Insights
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Savings Performance</span>
                  <strong style={{ color: reportTotals.savingsRate >= 20 ? '#10B981' : '#D97706' }}>
                    {reportTotals.savingsRate.toFixed(1)}% (Goal: ≥ 20%)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Total Logged Records</span>
                  <strong>{reportTotals.transactionCount} transactions</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span style={{ color: '#475569' }}>Average Expense Amount</span>
                  <strong>{formatCurrency(reportTotals.avgTicket)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT VIEW 2: INCOME VS EXPENSE ANALYSIS */}
      {reportType === 'income_vs_expense' && (
        <div className="card" style={{ padding: '2rem', background: '#FFFFFF', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.35rem' }}>
            Income vs. Expense Trajectory
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
            Historical cashflow trend comparison across accounting cycles
          </p>

          <StockMarketChart
            data={trends}
            title="Net Cashflow Timeline"
            subtext="Market-style expenditure timeline vs historical averages"
            height={260}
          />
        </div>
      )}

      {/* REPORT VIEW 3: BUDGET COMPLIANCE AUDIT */}
      {reportType === 'budget_audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>
              Category Budget Variance Audit
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Audited budget limits vs actual spending distribution
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Budget Cap (₹)</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Actual Spend (₹)</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Variance (Headroom)</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'center' }}>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => {
                  const limit = parseFloat(item.budgetLimit) || 0;
                  const spend = parseFloat(item.totalAmount) || 0;
                  const variance = limit - spend;
                  const isOver = limit > 0 && spend > limit;

                  return (
                    <tr key={item.categoryId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#0F172A' }}>
                        {item.categoryName}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', color: '#64748B' }}>
                        {limit > 0 ? formatCurrency(limit) : 'Unset'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                        {formatCurrency(spend)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: '700', color: isOver ? '#DC2626' : (limit > 0 ? '#10B981' : '#64748B') }}>
                        {limit > 0 ? formatCurrency(variance) : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span className="badge" style={{
                          background: isOver ? '#FEF2F2' : '#ECFDF5',
                          color: isOver ? '#DC2626' : '#059669',
                          borderColor: isOver ? '#FECACA' : '#A7F3D0'
                        }}>
                          {isOver ? 'OVER BUDGET' : (limit > 0 ? 'COMPLIANT' : 'NO LIMIT')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT VIEW 4: ITEMIZED AUDIT LEDGER */}
      {reportType === 'ledger' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>
              Itemized Financial Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Chronological log of all recorded inflows, salaries, and expense vouchers
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Description</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Channel</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>No financial records found for this period or filter.</p>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Try choosing another time period or clearing your search query.</span>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>
                          {formatDate(tx.transactionDate || tx.expenseDate)}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#0F172A' }}>
                          {tx.title}
                          {tx.description && <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '400' }}>{tx.description}</div>}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span className="badge" style={{
                            background: isIncome ? '#ECFDF5' : '#F1F5F9',
                            color: isIncome ? '#059669' : '#475569',
                            borderColor: isIncome ? '#A7F3D0' : '#E2E8F0'
                          }}>
                            {isIncome ? 'INCOME' : (tx.category?.name || 'EXPENSE')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>
                          {tx.paymentMethod || 'CARD'}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: '800', color: isIncome ? '#10B981' : '#0F172A' }}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
