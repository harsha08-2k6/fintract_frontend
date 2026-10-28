import React, { useState, useEffect, useMemo } from 'react';
import { reportService } from '../services/reportService';
import { expenseService } from '../services/expenseService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { formatCurrency } from '../utils/formatCurrency';
import { StockMarketChart } from '../components/StockMarketChart';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Wallet, 
  Target, 
  Activity, 
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Percent
} from 'lucide-react';

/**
 * Largest Remainder Method: reconciles rounded integer percentages so their sum is exactly 100%
 */
function reconcilePercentages(items) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) {
    return items.map(item => ({ ...item, percentage: 0 }));
  }

  const rawPercentages = items.map(item => (item.amount / total) * 100);
  const floors = rawPercentages.map(Math.floor);
  const remainders = rawPercentages.map((p, i) => ({ index: i, remainder: p - floors[i] }));
  
  const currentSum = floors.reduce((a, b) => a + b, 0);
  const diff = 100 - currentSum;

  remainders.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < diff && i < remainders.length; i++) {
    floors[remainders[i].index] += 1;
  }

  return items.map((item, i) => ({
    ...item,
    rawPercentage: rawPercentages[i],
    percentage: floors[i]
  }));
}

/**
 * Helper to construct continuous monthly timeline for any time range
 */
function buildMonthlyTimeline(expensesList, timeRange) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let monthsCount = 6;
  if (timeRange === '1M') monthsCount = 2; // Show prior and current month for trajectory
  else if (timeRange === '3M') monthsCount = 3;
  else if (timeRange === '6M') monthsCount = 6;
  else if (timeRange === '1Y') monthsCount = 12;
  else if (timeRange === 'ALL') {
    const dates = (expensesList || [])
      .map(e => e.expenseDate || e.transactionDate || e.createdAt)
      .filter(Boolean)
      .sort();
    if (dates.length > 0) {
      const first = new Date(dates[0]);
      const diffMonths = (currentYear - first.getFullYear()) * 12 + (currentMonth - first.getMonth()) + 1;
      monthsCount = Math.max(2, Math.min(24, diffMonths));
    } else {
      monthsCount = 6;
    }
  }

  // Pre-calculate expense sums by YYYY-MM
  const spendByYm = {};
  const countByYm = {};
  (expensesList || []).forEach(e => {
    const dStr = e.expenseDate || e.transactionDate || e.createdAt;
    if (!dStr) return;
    const ym = dStr.slice(0, 7);
    spendByYm[ym] = (spendByYm[ym] || 0) + (parseFloat(e.amount) || 0);
    countByYm[ym] = (countByYm[ym] || 0) + 1;
  });

  const timeline = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    timeline.push({
      yearMonth: ym,
      month: monthName,
      totalSpent: spendByYm[ym] || 0,
      transactionCount: countByYm[ym] || 0
    });
  }

  return timeline;
}

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [timeRange, setTimeRange] = useState('6M'); // '1M' | '3M' | '6M' | '1Y' | 'ALL'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashData, trendsData, expData, txData, catData] = await Promise.all([
        reportService.getDashboardReport().catch(() => null),
        reportService.getMonthlyTrends().catch(() => []),
        expenseService.getExpenses({ size: 200 }).catch(() => ({ content: [] })),
        transactionService.getAllTransactions().catch(() => []),
        categoryService.getAllCategories().catch(() => [])
      ]);

      if (dashData) setReport(dashData);
      
      const expList = Array.isArray(expData) ? expData : (expData?.content || []);
      const txList = Array.isArray(txData) ? txData : (txData?.content || []);
      const catList = Array.isArray(catData) ? catData : (catData?.content || []);

      // If expList is empty but txList has transactions, use txList filtered by non-income
      const allExpenses = expList.length > 0 
        ? expList 
        : txList.filter(t => t.type !== 'INCOME');

      setExpenses(allExpenses);
      setTransactions(txList.length > 0 ? txList : allExpenses);
      setCategories(catList);

      // Ensure trends are populated
      if (Array.isArray(trendsData) && trendsData.length > 0) {
        setTrends(trendsData);
      } else {
        setTrends(buildTrendsFromExpenses(allExpenses));
      }
    } catch (err) {
      console.error('Error fetching analytics intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Shared Period Definition & Date Matcher
  const periodInfo = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (9 for October)
    const currentDay = now.getDate(); // 24

    if (timeRange === '1M') {
      const currentYm = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevMonthName = prevDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const monthShort = now.toLocaleString('en-US', { month: 'short' });

      return {
        id: '1M',
        title: "This Month's Spending",
        budgetTitle: "Monthly Budget Utilization",
        periodLabel: currentMonthName,
        prevPeriodLabel: prevMonthName,
        actualDays: currentDay,
        dateRangeFormatted: `${monthShort} 1 – ${monthShort} ${currentDay}, ${currentYear}`,
        isSingleMonth: true,
        matchesPeriod: (d) => (d || '').startsWith(currentYm),
        matchesPrevPeriod: (d) => (d || '').startsWith(prevYm)
      };
    }

    if (timeRange === '3M') {
      const cutoffDate = new Date(currentYear, currentMonth - 2, 1);
      const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      const prevCutoffDate = new Date(currentYear, currentMonth - 5, 1);
      const prevCutoffStr = `${prevCutoffDate.getFullYear()}-${String(prevCutoffDate.getMonth() + 1).padStart(2, '0')}-01`;

      const msElapsed = now.getTime() - cutoffDate.getTime();
      const actualDays = Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1);
      const startShort = cutoffDate.toLocaleString('en-US', { month: 'short' });
      const endShort = now.toLocaleString('en-US', { month: 'short' });

      return {
        id: '3M',
        title: "3-Month Spending",
        budgetTitle: "3-Month Budget Utilization",
        periodLabel: "Last 3 Months",
        prevPeriodLabel: "Previous 3 Months",
        actualDays,
        dateRangeFormatted: `${startShort} 1 – ${endShort} ${currentDay}, ${currentYear}`,
        isSingleMonth: false,
        monthsCount: 3,
        matchesPeriod: (d) => (d || '') >= cutoffStr,
        matchesPrevPeriod: (d) => (d || '') >= prevCutoffStr && (d || '') < cutoffStr
      };
    }

    if (timeRange === '6M') {
      const cutoffDate = new Date(currentYear, currentMonth - 5, 1);
      const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-01`;

      const prevCutoffDate = new Date(currentYear, currentMonth - 11, 1);
      const prevCutoffStr = `${prevCutoffDate.getFullYear()}-${String(prevCutoffDate.getMonth() + 1).padStart(2, '0')}-01`;

      const msElapsed = now.getTime() - cutoffDate.getTime();
      const actualDays = Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1);
      const startShort = cutoffDate.toLocaleString('en-US', { month: 'short' });
      const endShort = now.toLocaleString('en-US', { month: 'short' });

      return {
        id: '6M',
        title: "6-Month Spending",
        budgetTitle: "6-Month Budget Utilization",
        periodLabel: "Last 6 Months",
        prevPeriodLabel: "Previous 6 Months",
        actualDays,
        dateRangeFormatted: `${startShort} 1 – ${endShort} ${currentDay}, ${currentYear}`,
        isSingleMonth: false,
        monthsCount: 6,
        matchesPeriod: (d) => (d || '') >= cutoffStr,
        matchesPrevPeriod: (d) => (d || '') >= prevCutoffStr && (d || '') < cutoffStr
      };
    }

    if (timeRange === '1Y') {
      const cutoffDate = new Date(currentYear, currentMonth - 11, 1);
      const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-01`;

      const prevCutoffDate = new Date(currentYear - 2, currentMonth + 1, 1);
      const prevCutoffStr = `${prevCutoffDate.getFullYear()}-${String(prevCutoffDate.getMonth() + 1).padStart(2, '0')}-01`;

      const msElapsed = now.getTime() - cutoffDate.getTime();
      const actualDays = Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1);
      const startShort = cutoffDate.toLocaleString('en-US', { month: 'short' });
      const endShort = now.toLocaleString('en-US', { month: 'short' });

      return {
        id: '1Y',
        title: "1-Year Spending",
        budgetTitle: "1-Year Budget Utilization",
        periodLabel: "Past 12 Months",
        prevPeriodLabel: "Previous Year",
        actualDays,
        dateRangeFormatted: `${startShort} 1, ${cutoffDate.getFullYear()} – ${endShort} ${currentDay}, ${currentYear}`,
        isSingleMonth: false,
        monthsCount: 12,
        matchesPeriod: (d) => (d || '') >= cutoffStr,
        matchesPrevPeriod: (d) => (d || '') >= prevCutoffStr && (d || '') < cutoffStr
      };
    }

    // ALL TIME
    const dates = (expenses || [])
      .map(e => e.expenseDate || e.transactionDate || e.createdAt)
      .filter(Boolean)
      .sort();
    let actualDays = 30;
    let dateRangeFormatted = 'Recorded History';
    if (dates.length > 0) {
      const first = new Date(dates[0]);
      const msElapsed = now.getTime() - first.getTime();
      actualDays = Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1);
      const firstStr = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const nowStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      dateRangeFormatted = `${firstStr} – ${nowStr}`;
    }

    return {
      id: 'ALL',
      title: "All-Time Spending",
      budgetTitle: "Overall Budget Utilization",
      periodLabel: "All Time",
      prevPeriodLabel: null,
      actualDays,
      dateRangeFormatted,
      isSingleMonth: false,
      monthsCount: null,
      matchesPeriod: () => true,
      matchesPrevPeriod: () => false
    };
  }, [timeRange, expenses]);

  // 1. Continuous Timeline Trends for StockMarketChart
  const filteredTrends = useMemo(() => {
    return buildMonthlyTimeline(expenses, timeRange);
  }, [expenses, timeRange]);

  // 2. Headline Period Spend derived directly from the chart's monthly data points (guarantees mathematical unity)
  const periodSpend = useMemo(() => {
    return filteredTrends.reduce((sum, month) => sum + (parseFloat(month.totalSpent) || 0), 0);
  }, [filteredTrends]);

  // 3. Active YearMonth Set from the timeline
  const activeYmSet = useMemo(() => {
    return new Set(filteredTrends.map(t => t.yearMonth));
  }, [filteredTrends]);

  // 4. Filtered Expenses strictly matching the timeline months
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    if (timeRange === 'ALL') return expenses;
    return expenses.filter(e => {
      const d = e.expenseDate || e.transactionDate || e.createdAt || '';
      return activeYmSet.has(d.slice(0, 7));
    });
  }, [expenses, activeYmSet, timeRange]);

  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.filter(t => {
      const d = t.transactionDate || t.expenseDate || t.createdAt || '';
      return periodInfo.matchesPeriod(d);
    });
  }, [transactions, periodInfo]);

  // Previous Period Spend for Period-over-Period Delta
  const prevPeriodSpend = useMemo(() => {
    if (timeRange === 'ALL') return 0;
    const prevExpenses = expenses.filter(e => {
      const d = e.expenseDate || e.transactionDate || e.createdAt || '';
      return periodInfo.matchesPrevPeriod(d);
    });
    return prevExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses, periodInfo, timeRange]);

  // Percentage Change vs Comparison Period (returns null if no prior spend)
  const momChange = useMemo(() => {
    if (prevPeriodSpend > 0) {
      return ((periodSpend - prevPeriodSpend) / prevPeriodSpend) * 100;
    }
    if (timeRange === '1M' && report?.monthOverMonthChangePercentage !== undefined && report?.monthOverMonthChangePercentage !== null) {
      return report.monthOverMonthChangePercentage;
    }
    return null;
  }, [periodSpend, prevPeriodSpend, timeRange, report]);

  // Category Outflow Share (strictly reflects the selected period and relative share of total outflow)
  const categoryStats = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) return [];
    const map = {};

    filteredExpenses.forEach(exp => {
      const amt = parseFloat(exp.amount) || 0;
      const catName = exp.category?.name || exp.categoryName || 'General';
      const catColor = exp.category?.colorCode || exp.colorCode || '#10B981';
      const catId = exp.categoryId || exp.category?.id || catName;

      if (!map[catName]) {
        map[catName] = {
          categoryId: catId,
          categoryName: catName,
          colorCode: catColor,
          totalAmount: 0,
          transactionCount: 0
        };
      }
      map[catName].totalAmount += amt;
      map[catName].transactionCount += 1;
    });

    return Object.values(map).map(cat => ({
      ...cat,
      percentage: periodSpend > 0 ? (cat.totalAmount / periodSpend) * 100 : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredExpenses, periodSpend]);

  // Payment Rails & Channels Breakdown (reconciled cleanly to 100% using Largest Remainder Method)
  const paymentMethodStats = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) return [];
    const map = {
      'UPI': 0,
      'CARD': 0,
      'CASH': 0,
      'BANK_TRANSFER': 0,
      'OTHER': 0
    };

    filteredExpenses.forEach(exp => {
      const raw = String(exp.paymentMethod || 'CARD').toUpperCase().trim();
      let method = 'OTHER';
      if (raw === 'CARD' || raw.includes('DEBIT') || raw.includes('CREDIT') || raw.includes('VISA') || raw.includes('MASTERCARD')) {
        method = 'CARD';
      } else if (raw === 'UPI' || raw.includes('WALLET') || raw.includes('PAYTM') || raw.includes('GPAY') || raw.includes('PHONEPE')) {
        method = 'UPI';
      } else if (raw === 'CASH') {
        method = 'CASH';
      } else if (raw.includes('BANK') || raw.includes('WIRE') || raw.includes('TRANSFER') || raw.includes('EFT') || raw.includes('ACH') || raw.includes('NETBANKING')) {
        method = 'BANK_TRANSFER';
      }
      const amt = parseFloat(exp.amount) || 0;
      map[method] += amt;
    });

    const labels = {
      'UPI': 'UPI & Digital Wallets',
      'CARD': 'Credit / Debit Card',
      'CASH': 'Cash Outflow',
      'BANK_TRANSFER': 'Bank Wire / EFT',
      'OTHER': 'Other Payment Rails'
    };

    const colors = {
      'UPI': '#059669',
      'CARD': '#10B981',
      'CASH': '#F59E0B',
      'BANK_TRANSFER': '#6366F1',
      'OTHER': '#64748B'
    };

    const items = Object.entries(map)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        color: colors[key] || '#10B981',
        amount: value
      }))
      .sort((a, b) => b.amount - a.amount);

    return reconcilePercentages(items);
  }, [filteredExpenses]);

  // Biggest Expense strictly in the selected period
  const highestExpense = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      return { amount: 0, title: 'No transactions logged' };
    }
    return filteredExpenses.reduce((max, e) => (parseFloat(e.amount) > parseFloat(max.amount || 0) ? e : max), filteredExpenses[0]);
  }, [filteredExpenses]);

  // Daily Average & Projection / Run Rate Calculations (calculated strictly from actual calendar days)
  const dailyStats = useMemo(() => {
    const actualDays = periodInfo.actualDays || 1;
    const dailyAvg = actualDays > 0 ? periodSpend / actualDays : 0;
    const monthlyRunRate = dailyAvg * 30; // strict mathematical parity

    if (timeRange === '1M') {
      const projectedMonth = dailyAvg * 30;
      return {
        dailyAvg,
        basisLabel: `Basis: Average across ${actualDays} actual calendar days in period (${periodInfo.dateRangeFormatted})`,
        secondaryLabel: `Estimated Month Total:`,
        secondaryValue: formatCurrency(projectedMonth),
        secondaryNote: `(projected over 30 days)`
      };
    }

    return {
      dailyAvg,
      basisLabel: `Basis: Average across ${actualDays} actual calendar days in period (${periodInfo.dateRangeFormatted})`,
      secondaryLabel: `Monthly Run Rate:`,
      secondaryValue: formatCurrency(monthlyRunRate),
      secondaryNote: `/ month`
    };
  }, [timeRange, periodInfo, periodSpend]);

  // Budget Health calculation (scaled to period window)
  const budgetStats = useMemo(() => {
    const totalConfiguredBudget = categories.reduce((sum, c) => sum + (parseFloat(c.budgetLimit) || 0), 0);
    
    // Check categories with active expenses in this period
    const activeCatIds = new Set(filteredExpenses.map(e => String(e.categoryId || e.category?.id || '')));
    const activeCatBudget = categories
      .filter(c => activeCatIds.has(String(c.id)))
      .reduce((sum, c) => sum + (parseFloat(c.budgetLimit) || 0), 0);

    const monthsCount = periodInfo.monthsCount || (timeRange === '1M' ? 1 : 1);
    
    let basisBudget = totalConfiguredBudget;
    let limitLabel = '';

    if (timeRange === '1M') {
      if (activeCatBudget > 0) {
        basisBudget = activeCatBudget; // e.g. ₹16,000 Education budget
        limitLabel = `₹${Math.round(activeCatBudget).toLocaleString('en-IN')} active limit`;
      } else {
        basisBudget = totalConfiguredBudget > 0 ? totalConfiguredBudget : 1;
        limitLabel = `₹${Math.round(totalConfiguredBudget).toLocaleString('en-IN')} total limit`;
      }
    } else {
      // Multi-month period: scale monthly budget by number of months
      basisBudget = totalConfiguredBudget * monthsCount;
      limitLabel = `₹${Math.round(basisBudget).toLocaleString('en-IN')} ${monthsCount}-mo limit`;
    }

    const usedPct = basisBudget > 0 ? (periodSpend / basisBudget) * 100 : 0;

    const overBudgetCategories = categories.filter(c => {
      const catSpent = filteredExpenses
        .filter(e => String(e.categoryId || e.category?.id) === String(c.id))
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const catLimit = (c.budgetLimit || 0) * (monthsCount || 1);
      return catLimit > 0 && catSpent > catLimit;
    });

    return {
      percentage: Math.min(100, Math.round(usedPct)),
      totalBudget: basisBudget,
      limitLabel,
      isOverBudget: overBudgetCategories.length > 0,
      overBudgetCount: overBudgetCategories.length
    };
  }, [categories, filteredExpenses, periodSpend, timeRange]);

  // Velocity Metrics
  const velocityStats = useMemo(() => {
    const totalTxCount = filteredTransactions.length || (timeRange === 'ALL' ? (report?.totalTransactions || 7) : filteredExpenses.length);
    const expenseCount = filteredExpenses.length;
    const avgExpenseValue = expenseCount > 0 ? periodSpend / expenseCount : 0;
    return {
      totalTxCount,
      expenseCount,
      avgExpenseValue
    };
  }, [filteredTransactions, filteredExpenses, periodSpend, timeRange, report]);

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
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A' }}>Generating Financial Intelligence...</h3>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Crunching real-time trajectories, category velocity & budget variances
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Top Header & Analytics Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ECFDF5',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                Spending Analytics
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                Visual charts and insights into your daily, monthly, and category spending habits
              </p>
            </div>
          </div>
        </div>

        {/* Time Window Buttons - Single shared date filter driving all charts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#FFFFFF',
          padding: '0.35rem',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          {[
            { id: '1M', label: '1M' },
            { id: '3M', label: '3M' },
            { id: '6M', label: '6M' },
            { id: '1Y', label: '1Y' },
            { id: 'ALL', label: 'All Time' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                background: timeRange === t.id ? '#10B981' : 'transparent',
                color: timeRange === t.id ? '#FFFFFF' : '#64748B',
                fontSize: '0.8rem',
                fontWeight: timeRange === t.id ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            title="Refresh Data"
            style={{
              padding: '0.4rem',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Intelligence KPI Matrix */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {/* KPI 1: Current Outflow */}
        <div className="card" style={{ padding: '1.4rem', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10B981' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {periodInfo.title}
              </span>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', fontWeight: '500' }}>
                {periodInfo.dateRangeFormatted} ({periodInfo.actualDays} days)
              </div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
            {formatCurrency(periodSpend)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.65rem', fontSize: '0.8rem' }}>
            {momChange !== null ? (
              <>
                {momChange >= 0 ? (
                  <span style={{ color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                    <ArrowUpRight size={15} color="#16A34A" /> +{momChange.toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                    <ArrowDownRight size={15} color="#DC2626" /> {momChange.toFixed(1)}%
                  </span>
                )}
                <span style={{ color: '#94A3B8' }}>
                  {timeRange === '1M' ? 'vs last month' : (periodInfo.prevPeriodLabel ? `vs ${periodInfo.prevPeriodLabel}` : 'vs baseline')}
                </span>
              </>
            ) : (
              <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                {periodInfo.prevPeriodLabel ? `No spend recorded in ${periodInfo.prevPeriodLabel}` : 'No prior baseline'}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Average Daily Spend */}
        <div className="card" style={{ padding: '1.4rem', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#059669' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average Daily Spend
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
            {formatCurrency(dailyStats.dailyAvg)}
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#64748B' }}> / day</span>
          </div>
          <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: '#94A3B8' }}>
            {dailyStats.basisLabel}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#64748B' }}>
            {dailyStats.secondaryLabel} <strong style={{ color: '#0F172A' }}>{dailyStats.secondaryValue}</strong> {dailyStats.secondaryNote}
          </div>
        </div>

        {/* KPI 3: Budget Utilization */}
        <div className="card" style={{ padding: '1.4rem', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: budgetStats.isOverBudget ? '#F59E0B' : '#10B981' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {periodInfo.budgetTitle || 'Budget Utilization'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
            {budgetStats.totalBudget > 0 ? `${budgetStats.percentage}%` : 'N/A'}
          </div>
          <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: budgetStats.isOverBudget ? '#DC2626' : '#10B981', fontWeight: '600' }}>
            {budgetStats.isOverBudget 
              ? `${budgetStats.overBudgetCount} categories over limit`
              : `All categories within limit (${formatCurrency(periodSpend)} of ${formatCurrency(budgetStats.totalBudget)})`}
          </div>
        </div>

        {/* KPI 4: Biggest Single Expense */}
        <div className="card" style={{ padding: '1.4rem', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#0F172A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Biggest Expense
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
            {formatCurrency(highestExpense.amount || 0)}
          </div>
          <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: '#64748B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {highestExpense.title || 'No transactions logged'}
          </div>
        </div>
      </div>

      {/* Main Visuals Grid: Monthly Trajectory Chart & Category Share */}
      <div className="grid-2" style={{ marginBottom: '2rem', gridTemplateColumns: '1.4fr 1fr' }}>
        {/* Visual 1: Stock Market Trajectory Chart */}
        <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
          <StockMarketChart 
            data={filteredTrends} 
            title="Monthly Spending Trajectory"
            subtext="Monthly expense trends for the selected period. Hover over a month to inspect spending."
            height={260}
            periodTotal={periodSpend}
            periodLabel={periodInfo.periodLabel}
            periodDelta={momChange}
            periodDeltaLabel={periodInfo.prevPeriodLabel}
          />
        </div>

        {/* Visual 2: Category Distribution Matrix */}
        <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChartIcon size={18} color="#10B981" />
                Category Outflow Share
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                Spending concentration by budget category ({periodInfo.periodLabel})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categoryStats.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No category outflows in this period.</p>
            ) : (
              categoryStats.slice(0, 5).map((cat) => {
                const spent = parseFloat(cat.totalAmount) || 0;
                const percent = cat.percentage ? parseFloat(cat.percentage) : 0;
                const color = cat.colorCode || '#10B981';

                return (
                  <div key={cat.categoryId || cat.categoryName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: '600', color: '#0F172A' }}>{cat.categoryName}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{formatCurrency(spent)}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(2, percent))}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Intelligence: Payment Method Channels & Smart Insights AI */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Payment Channels Breakdown */}
        <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <CreditCard size={18} color="#10B981" />
            Payment Rails & Channels
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
            Expenditure split across cards, UPI, cash, and bank transfers ({periodInfo.periodLabel})
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {paymentMethodStats.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No payment method data recorded in this period.</p>
            ) : (
              paymentMethodStats.map(method => (
                <div key={method.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: method.color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1E293B' }}>{method.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>{formatCurrency(method.amount)}</span>
                    <span style={{ fontSize: '0.75rem', background: '#E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700', color: '#475569' }}>
                      {method.percentage}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Financial Insights Assistant */}
        <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#10B981" />
              Automated Financial Insights
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Automated Financial Insights</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Insight 1: Spending Stability */}
            <div style={{ padding: '0.85rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', gap: '0.75rem' }}>
              <ShieldCheck size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#15803D', display: 'block', marginBottom: '2px' }}>
                  Spending Stability Status
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                  {prevPeriodSpend === 0 || momChange === null ? (
                    `No spending recorded in ${periodInfo.prevPeriodLabel ? `the ${periodInfo.prevPeriodLabel.toLowerCase()} period` : 'the previous period'} for comparison. Baseline spending tracking active.`
                  ) : momChange < 0 ? (
                    `Expenses dropped by ${Math.abs(momChange).toFixed(1)}% compared to ${periodInfo.prevPeriodLabel || 'the prior period'}. Budget efficiency remains optimal.`
                  ) : momChange > 0 ? (
                    `Expenditure increased by ${momChange.toFixed(1)}% compared to ${periodInfo.prevPeriodLabel || 'the prior period'}. Monitoring discretionary categories is advised.`
                  ) : (
                    `Spending remained unchanged compared to ${periodInfo.prevPeriodLabel || 'the prior period'}.`
                  )}
                </p>
              </div>
            </div>

            {/* Insight 2: Primary Cost Driver */}
            <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '0.75rem' }}>
              <Target size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                  Primary Cost Driver
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                  {categoryStats.length > 0 ? (
                    <>
                      <strong>{categoryStats[0].categoryName}</strong> accounts for the largest share of outflows at {formatCurrency(categoryStats[0].totalAmount)} ({categoryStats[0].percentage.toFixed(1)}% of {periodInfo.periodLabel} spending).
                    </>
                  ) : (
                    'No category outflows recorded in this period.'
                  )}
                </p>
              </div>
            </div>

            {/* Insight 3: Transaction Velocity & Average Expense Value */}
            <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '0.75rem' }}>
              <Layers size={20} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '2px' }}>
                  Transaction Velocity
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                  Total of <strong>{velocityStats.totalTxCount}</strong> corporate transactions registered in the ledger with an Average Expense Value of <strong>{formatCurrency(velocityStats.avgExpenseValue)}</strong> across {velocityStats.expenseCount} expense {velocityStats.expenseCount === 1 ? 'entry' : 'entries'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

