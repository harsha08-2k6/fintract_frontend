import { apiRequest } from './api';

function getLocalExpenses() {
  try {
    const legacyData = localStorage.getItem('fintrack_local_expenses');
    const transactionData = localStorage.getItem('fintrack_local_transactions');
    const legacyExpenses = legacyData ? JSON.parse(legacyData) : [];
    const transactions = transactionData
      ? JSON.parse(transactionData).filter(transaction => transaction.type === 'EXPENSE')
      : [];
    const byId = new Map([...legacyExpenses, ...transactions].map(expense => [String(expense.id), expense]));
    return Array.from(byId.values());
  } catch {
    return [];
  }
}

function saveLocalExpenses(exps) {
  localStorage.setItem('fintrack_local_expenses', JSON.stringify(exps));
}

export const expenseService = {
  async getExpenses(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page !== undefined) query.append('page', params.page);
      if (params.size !== undefined) query.append('size', params.size);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      if (params.categoryId) query.append('categoryId', params.categoryId);

      const queryString = query.toString() ? `?${query.toString()}` : '';
      return await apiRequest(`/api/expenses${queryString}`);
    } catch {
      let list = getLocalExpenses();
      if (params.categoryId) {
        list = list.filter(e => e.categoryId === parseInt(params.categoryId));
      }
      if (params.startDate) {
        list = list.filter(e => e.expenseDate >= params.startDate);
      }
      if (params.endDate) {
        list = list.filter(e => e.expenseDate <= params.endDate);
      }
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        size: 20,
        number: 0
      };
    }
  },

  async getExpenseById(id) {
    try {
      return await apiRequest(`/api/expenses/${id}`);
    } catch {
      const list = getLocalExpenses();
      return list.find(e => e.id === parseInt(id)) || list[0];
    }
  },

  async createExpense(expenseData) {
    try {
      return await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData)
      });
    } catch {
      const list = getLocalExpenses();
      const newExp = {
        id: Date.now(),
        ...expenseData,
        amount: parseFloat(expenseData.amount) || 0,
        expenseDate: expenseData.expenseDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      list.unshift(newExp);
      saveLocalExpenses(list);
      return newExp;
    }
  },

  async updateExpense(id, expenseData) {
    try {
      return await apiRequest(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData)
      });
    } catch {
      let list = getLocalExpenses();
      list = list.map(e => String(e.id) === String(id) ? { ...e, ...expenseData, amount: parseFloat(expenseData.amount) || e.amount } : e);
      saveLocalExpenses(list);

      // Also sync to unified transactions
      try {
        const txRaw = localStorage.getItem('fintrack_local_transactions');
        if (txRaw) {
          const txs = JSON.parse(txRaw).map(t => String(t.id) === String(id) ? { ...t, ...expenseData, amount: parseFloat(expenseData.amount) || t.amount } : t);
          localStorage.setItem('fintrack_local_transactions', JSON.stringify(txs));
        }
      } catch {}

      return list.find(e => String(e.id) === String(id));
    }
  },

  async deleteExpense(id) {
    try {
      return await apiRequest(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
    } catch {
      let list = getLocalExpenses();
      list = list.filter(e => String(e.id) !== String(id));
      saveLocalExpenses(list);

      // Also sync delete to unified transactions
      try {
        const txRaw = localStorage.getItem('fintrack_local_transactions');
        if (txRaw) {
          const txs = JSON.parse(txRaw).filter(t => String(t.id) !== String(id));
          localStorage.setItem('fintrack_local_transactions', JSON.stringify(txs));
        }
      } catch {}

      return null;
    }
  },

  async getSummary() {
    try {
      return await apiRequest('/api/expenses/summary');
    } catch {
      const list = getLocalExpenses();
      const totalAmount = list.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      return {
        totalAmount,
        totalCount: list.length,
        currentMonthAmount: totalAmount
      };
    }
  }
};
