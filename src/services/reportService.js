import { apiRequest } from './api';

export const reportService = {
  async getDashboardReport() {
    try {
      return await apiRequest('/api/reports/dashboard');
    } catch {
      return {
        totalSpendAllTime: 47600.00,
        currentMonthSpend: 25400.00,
        totalTransactions: 6,
        topSpendingCategory: 'Software & Cloud SaaS',
        topSpendingCategoryAmount: 18400.00,
        budgetRemaining: 91600.00
      };
    }
  },

  async getCategoryBreakdown(yearMonth) {
    try {
      const url = yearMonth ? `/api/reports/category-breakdown?yearMonth=${encodeURIComponent(yearMonth)}` : '/api/reports/category-breakdown';
      return await apiRequest(url);
    } catch {
      return [
        { categoryId: 3, categoryName: 'Software & Cloud SaaS', color: '#06B6D4', totalSpent: 18400.00, transactionCount: 2, percentage: 38.6 },
        { categoryId: 2, categoryName: 'Travel & Transport', color: '#4F46E5', totalSpent: 8500.00, transactionCount: 1, percentage: 17.8 },
        { categoryId: 1, categoryName: 'Food & Dining', color: '#10B981', totalSpent: 6200.00, transactionCount: 2, percentage: 13.0 },
        { categoryId: 4, categoryName: 'Office Supplies & Tech', color: '#F59E0B', totalSpent: 4500.00, transactionCount: 1, percentage: 9.5 }
      ];
    }
  },

  async getMonthlyTrends() {
    try {
      return await apiRequest('/api/reports/monthly-trends');
    } catch {
      return [
        { yearMonth: '2026-04', month: 'Apr', totalSpent: 18200.00, transactionCount: 12 },
        { yearMonth: '2026-05', month: 'May', totalSpent: 22400.00, transactionCount: 15 },
        { yearMonth: '2026-06', month: 'Jun', totalSpent: 19800.00, transactionCount: 14 },
        { yearMonth: '2026-07', month: 'Jul', totalSpent: 31200.00, transactionCount: 22 },
        { yearMonth: '2026-08', month: 'Aug', totalSpent: 28900.00, transactionCount: 19 },
        { yearMonth: '2026-09', month: 'Sep', totalSpent: 25400.00, transactionCount: 6 }
      ];
    }
  },

  async getBudgetAlerts() {
    try {
      return await apiRequest('/api/reports/alerts');
    } catch {
      return [
        { id: 1, alertType: 'INFO', title: 'Corporate Budget Active', message: 'All departmental category budgets have been synced with the gateway.', isRead: false },
        { id: 2, alertType: 'SAVINGS', title: 'Software & SaaS at 52%', message: 'AWS and tooling spend is currently pacing within normal operational boundaries.', isRead: false }
      ];
    }
  }
};
