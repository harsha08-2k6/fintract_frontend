import { apiRequest } from './api';

export const reportService = {
  async getDashboardReport() {
    try {
      const data = await apiRequest('/api/reports/dashboard');
      if (data) return data;
    } catch {}
    return {
      totalSpendAllTime: 0,
      currentMonthSpend: 0,
      totalIncomeAllTime: 0,
      currentMonthIncome: 0,
      totalTransactions: 0,
      topSpendingCategory: 'None',
      topSpendingCategoryAmount: 0,
      budgetRemaining: 0,
      categoryBreakdowns: [],
      monthlyTrends: []
    };
  },

  async getCategoryBreakdown(yearMonth) {
    try {
      const url = yearMonth ? `/api/reports/category-breakdown?yearMonth=${encodeURIComponent(yearMonth)}` : '/api/reports/category-breakdown';
      const data = await apiRequest(url);
      if (data) return data;
    } catch {}
    return [];
  },

  async getMonthlyTrends() {
    try {
      const data = await apiRequest('/api/reports/monthly-trends');
      if (data) return data;
    } catch {}
    return [];
  },

  async getBudgetAlerts() {
    try {
      const data = await apiRequest('/api/reports/alerts');
      if (data) return data;
    } catch {}
    return [];
  }
};
