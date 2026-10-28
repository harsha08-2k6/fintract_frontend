import { apiRequest } from './api';

export const transactionService = {
  // Unified Transactions
  getAllTransactions: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.type) query.append('type', params.type);
      if (params.categoryId) query.append('categoryId', params.categoryId);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      
      const endpoint = `/api/transactions${query.toString() ? `?${query.toString()}` : ''}`;
      const data = await apiRequest(endpoint, { method: 'GET' });
      return data || [];
    } catch (err) {
      return getLocalTransactions(params);
    }
  },

  getTransactionById: async (id) => {
    return apiRequest(`/api/transactions/${id}`, { method: 'GET' });
  },

  createTransaction: async (data) => {
    try {
      return await apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err) {
      return saveLocalTransaction(data);
    }
  },

  updateTransaction: async (id, data) => {
    try {
      return await apiRequest(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (err) {
      const list = getLocalTransactions();
      const updated = list.find(transaction => String(transaction.id) === String(id));
      if (!updated) throw err;
      const next = list.map(transaction => String(transaction.id) === String(id)
        ? { ...transaction, ...data, amount: parseFloat(data.amount) || transaction.amount }
        : transaction);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next.find(transaction => String(transaction.id) === String(id));
    }
  },

  deleteTransaction: async (id) => {
    try {
      await apiRequest(`/api/transactions/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      deleteLocalTransaction(id);
      return true;
    }
  },

  // Income Specific Shortcuts
  getIncome: async (params = {}) => {
    return transactionService.getAllTransactions({ ...params, type: 'INCOME' });
  },

  createIncome: async (data) => {
    return transactionService.createTransaction({ ...data, type: 'INCOME' });
  },

  // Expense Specific Shortcuts
  getExpenses: async (params = {}) => {
    return transactionService.getAllTransactions({ ...params, type: 'EXPENSE' });
  },

  createExpense: async (data) => {
    return transactionService.createTransaction({ ...data, type: 'EXPENSE' });
  }
};

// Local storage fallback helpers
const LOCAL_STORAGE_KEY = 'fintrack_local_transactions';

function getLocalTransactions(params = {}) {
  try {
    const transactionRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const expenseRaw = localStorage.getItem('fintrack_local_expenses');
    const transactions = transactionRaw ? JSON.parse(transactionRaw) : [];
    const legacyExpenses = expenseRaw ? JSON.parse(expenseRaw).map(expense => ({ ...expense, type: 'EXPENSE' })) : [];
    const byId = new Map([...transactions, ...legacyExpenses].map(transaction => [String(transaction.id), transaction]));
    let list = Array.from(byId.values());
    if (params.type) {
      list = list.filter(t => t.type === params.type);
    }
    if (params.categoryId) {
      list = list.filter(t => String(t.categoryId) === String(params.categoryId));
    }
    if (params.startDate) {
      list = list.filter(t => (t.transactionDate || t.expenseDate || '') >= params.startDate);
    }
    if (params.endDate) {
      list = list.filter(t => (t.transactionDate || t.expenseDate || '') <= params.endDate);
    }
    return list;
  } catch {
    return [];
  }
}

function saveLocalTransaction(data) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const newTx = {
      id: Date.now(),
      ...data,
      amount: parseFloat(data.amount) || 0,
      transactionDate: data.transactionDate || data.expenseDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    list.unshift(newTx);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

    // If it's an expense, also sync into fintrack_local_expenses
    if (data.type === 'EXPENSE') {
      try {
        const expRaw = localStorage.getItem('fintrack_local_expenses');
        const expList = expRaw ? JSON.parse(expRaw) : [];
        const catRaw = localStorage.getItem('fintrack_local_categories');
        const catList = catRaw ? JSON.parse(catRaw) : [];
        const catObj = catList.find(c => String(c.id) === String(data.categoryId));

        expList.unshift({
          ...newTx,
          expenseDate: newTx.transactionDate,
          category: catObj || (data.category || null)
        });
        localStorage.setItem('fintrack_local_expenses', JSON.stringify(expList));
      } catch {}
    }

    return newTx;
  } catch {
    return { id: Date.now(), ...data };
  }
}

function deleteLocalTransaction(id) {
  try {
    const transactionRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const expenseRaw = localStorage.getItem('fintrack_local_expenses');
    if (transactionRaw) {
      const list = JSON.parse(transactionRaw).filter(t => String(t.id) !== String(id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
    if (expenseRaw) {
      const list = JSON.parse(expenseRaw).filter(t => String(t.id) !== String(id));
      localStorage.setItem('fintrack_local_expenses', JSON.stringify(list));
    }
  } catch {}
}
