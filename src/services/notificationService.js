import { apiRequest } from './api';

const STORAGE_KEY_NOTIFS = 'fintrack_notifications';
const STORAGE_KEY_PREFS = 'fintrack_notification_preferences';

export const DEFAULT_PREFERENCES = {
  emailNotificationsEnabled: true, // Overall email alerts toggle
  transactions: false,        // Successful transactions & income (opt-in)
  budgetAlerts: true,         // Budget 80%, 100%, and overspend
  savingsGoals: true,         // Goal contributions and milestones
  financialSummaries: true,   // Monthly report summaries
  spendingInsights: true,     // Anomaly & trend alerts
  securityAlerts: true        // Password, login & security (always critical)
};

const getUserId = () => {
  try {
    const userRaw = localStorage.getItem('spendwise_user_data');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      return u?.id || 'guest';
    }
  } catch {}
  return 'guest';
};

const getLocalNotifsKey = () => `${STORAGE_KEY_NOTIFS}_${getUserId()}`;
const getLocalPrefsKey = () => `${STORAGE_KEY_PREFS}_${getUserId()}`;

// Helper: Read active categories from local cache
function getActiveCategories() {
  try {
    const data = localStorage.getItem('fintrack_local_categories');
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

// Helper: Read active expenses from local cache
function getActiveExpenses() {
  try {
    const txRaw = localStorage.getItem('fintrack_local_transactions');
    const expRaw = localStorage.getItem('fintrack_local_expenses');
    const txList = txRaw ? JSON.parse(txRaw).filter(t => t.type === 'EXPENSE') : [];
    const expList = expRaw ? JSON.parse(expRaw) : [];
    const byId = new Map([...expList, ...txList].map(e => [String(e.id), e]));
    return Array.from(byId.values());
  } catch {
    return [];
  }
}

// Format currency safely in service without React dependencies
function formatInr(val) {
  const num = Math.round(Number(val) || 0);
  return '₹' + num.toLocaleString('en-IN');
}

/**
 * Dynamically computes budget notifications from the active categories and actual expenses
 * for the current period (YYYY-MM). Avoids static/hardcoded figures.
 */
function deriveDynamicBudgetAlerts(periodMonth) {
  const targetMonth = periodMonth || new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const categories = getActiveCategories();
  const expenses = getActiveExpenses();

  if (!categories.length) return [];

  // Group expense spending by category for the target month
  const spendByCat = {};
  expenses.forEach(exp => {
    const d = exp.expenseDate || exp.transactionDate || '';
    if (d.startsWith(targetMonth)) {
      const catId = String(exp.categoryId || exp.category?.id || '');
      const amt = parseFloat(exp.amount) || 0;
      spendByCat[catId] = (spendByCat[catId] || 0) + amt;
    }
  });

  const alerts = [];

  categories.forEach(cat => {
    const limit = parseFloat(cat.budgetLimit) || 0;
    if (limit <= 0) return;

    const catIdStr = String(cat.id);
    const spent = spendByCat[catIdStr] || 0;
    const usage = (spent / limit) * 100;
    const remaining = Math.max(0, limit - spent);

    if (spent > limit) {
      alerts.push({
        id: `dyn-budget-${cat.id}-${targetMonth}-exceeded`,
        title: `${cat.name} budget exceeded!`,
        message: `Spending reached ${formatInr(spent)} against the ${formatInr(limit)} limit (${formatInr(spent - limit)} over budget).`,
        category: 'BUDGET',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: 'categories',
        metadata: { categoryId: cat.id, categoryName: cat.name, spent, limit, period: targetMonth }
      });
    } else if (usage >= 80) {
      alerts.push({
        id: `dyn-budget-${cat.id}-${targetMonth}-warning`,
        title: `${cat.name} budget is ${Math.round(usage)}% used`,
        message: `${formatInr(spent)} of ${formatInr(limit)} used. Only ${formatInr(remaining)} remaining.`,
        category: 'BUDGET',
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: 'categories',
        metadata: { categoryId: cat.id, categoryName: cat.name, spent, limit, period: targetMonth }
      });
    }
  });

  return alerts;
}

function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(getLocalNotifsKey());
    let list = raw ? JSON.parse(raw) : null;

    // Detect and fix legacy inconsistent seed (₹14,000 of ₹15,000) or outdated Trip wording
    let needsSave = false;
    if (list && Array.isArray(list)) {
      list = list.map(item => {
        // Fix #1: Inconsistent hardcoded budget alert (₹14,000 of ₹15,000)
        if (item.id === 'seed-1' || (item.category === 'BUDGET' && item.message && item.message.includes('₹14,000 of ₹15,000'))) {
          needsSave = true;
          return {
            id: 'seed-1',
            title: 'Education budget on track',
            message: '₹2,000 of ₹16,000 used. ₹14,000 remaining headroom.',
            category: 'BUDGET',
            severity: 'INFO',
            timestamp: item.timestamp || new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            read: item.read || false,
            actionUrl: 'categories',
            metadata: { categoryName: 'Education', spent: 2000, limit: 16000 }
          };
        }
        // Fix #2: Savings goal progress accurate wording
        if (item.id === 'seed-2' || (item.category === 'GOAL' && item.message && !item.message.includes('₹3,400 of ₹15,000'))) {
          needsSave = true;
          return {
            id: 'seed-2',
            title: 'Trip savings goal updated',
            message: '₹500 contribution added. Your goal is now 23% complete (₹3,400 of ₹15,000 saved).',
            category: 'GOAL',
            severity: 'SUCCESS',
            timestamp: item.timestamp || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: item.read || false,
            actionUrl: 'goals',
            metadata: { goalName: 'Trip', amount: 500, currentAmount: 3400, targetAmount: 15000, progress: 23 }
          };
        }
        return item;
      });

      if (needsSave) {
        localStorage.setItem(getLocalNotifsKey(), JSON.stringify(list));
      }
      return list;
    }

    // Default Seed (Fresh start) with accurate dynamic-matched amounts
    const dynamicBudgetAlerts = deriveDynamicBudgetAlerts('2026-10');
    const defaultBudgetEntry = dynamicBudgetAlerts.length > 0 ? dynamicBudgetAlerts[0] : {
      id: 'seed-1',
      title: 'Education budget on track',
      message: '₹2,000 of ₹16,000 used. ₹14,000 remaining headroom.',
      category: 'BUDGET',
      severity: 'INFO',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: 'categories',
      metadata: { categoryName: 'Education', spent: 2000, limit: 16000 }
    };

    const initialSeed = [
      defaultBudgetEntry,
      {
        id: 'seed-2',
        title: 'Trip savings goal updated',
        message: '₹500 contribution added. Your goal is now 23% complete (₹3,400 of ₹15,000 saved).',
        category: 'GOAL',
        severity: 'SUCCESS',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: 'goals',
        metadata: { goalName: 'Trip', amount: 500, currentAmount: 3400, targetAmount: 15000, progress: 23 }
      },
      {
        id: 'seed-3',
        title: 'Expense recorded successfully',
        message: '₹250 expense added to Healthcare.',
        category: 'TRANSACTION',
        severity: 'INFO',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: 'transactions',
        metadata: { title: 'Medicines', amount: 250, categoryName: 'Healthcare' }
      }
    ];

    localStorage.setItem(getLocalNotifsKey(), JSON.stringify(initialSeed));
    return initialSeed;
  } catch {
    return [];
  }
}

function saveLocalNotifications(list) {
  try {
    localStorage.setItem(getLocalNotifsKey(), JSON.stringify(list));
    // Dispatch custom browser event so all components / Navbar update instantly in real-time
    window.dispatchEvent(new CustomEvent('fintrack_notifications_updated'));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

export const notificationService = {
  // 1. Get All Notifications (with optional category filter)
  async getNotifications(filterCategory = 'ALL') {
    try {
      const data = await apiRequest(`/api/notifications${filterCategory !== 'ALL' ? `?category=${filterCategory}` : ''}`);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      return getLocalNotifications();
    } catch {
      let list = getLocalNotifications();
      if (filterCategory && filterCategory !== 'ALL') {
        list = list.filter(n => n.category === filterCategory);
      }
      return list;
    }
  },

  // 2. Get Unread Count
  async getUnreadCount() {
    try {
      const data = await apiRequest('/api/notifications/unread-count');
      if (data && typeof data.count === 'number') return data.count;
      const list = getLocalNotifications();
      return list.filter(n => !n.read).length;
    } catch {
      const list = getLocalNotifications();
      return list.filter(n => !n.read).length;
    }
  },

  // 3. Mark Single Notification as Read
  async markAsRead(id) {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      const list = getLocalNotifications();
      const next = list.map(n => String(n.id) === String(id) ? { ...n, read: true } : n);
      saveLocalNotifications(next);
      return next;
    }
  },

  // 4. Mark All as Read
  async markAllAsRead() {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
    } catch {
      const list = getLocalNotifications();
      const next = list.map(n => ({ ...n, read: true }));
      saveLocalNotifications(next);
      return next;
    }
  },

  // 5. Dismiss / Delete a Notification
  async dismissNotification(id) {
    try {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch {
      const list = getLocalNotifications();
      const next = list.filter(n => String(n.id) !== String(id));
      saveLocalNotifications(next);
      return next;
    }
  },

  // 6. Clear All Notifications
  async clearAll() {
    try {
      await apiRequest('/api/notifications', { method: 'DELETE' });
    } catch {
      saveLocalNotifications([]);
      return [];
    }
  },

  // 7. Push a New Real Notification from Anywhere in FinTrack
  createNotification(notif) {
    const prefs = this.getPreferences();

    // Check user preferences before persisting
    if (notif.category === 'TRANSACTION' && !prefs.transactions) return null;
    if (notif.category === 'BUDGET' && !prefs.budgetAlerts) return null;
    if (notif.category === 'GOAL' && !prefs.savingsGoals) return null;
    if (notif.category === 'INSIGHT' && !prefs.spendingInsights) return null;
    if (notif.category === 'SUMMARY' && !prefs.financialSummaries) return null;
    // Security alerts are always enabled for critical events

    const newEntry = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: notif.title,
      message: notif.message,
      category: notif.category || 'TRANSACTION',
      severity: notif.severity || 'INFO', // 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
      timestamp: notif.timestamp || new Date().toISOString(),
      read: false,
      actionUrl: notif.actionUrl || null,
      metadata: notif.metadata || {}
    };

    const list = getLocalNotifications();

    // Anti-duplicate protection for budget threshold alerts in the same hour
    if (notif.category === 'BUDGET' && notif.metadata?.categoryId) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentDup = list.find(n => 
        n.category === 'BUDGET' &&
        String(n.metadata?.categoryId) === String(notif.metadata?.categoryId) &&
        new Date(n.timestamp).getTime() > oneHourAgo &&
        n.title === notif.title
      );
      if (recentDup) return recentDup;
    }

    list.unshift(newEntry);
    saveLocalNotifications(list);
    return newEntry;
  },

  // 8. Generate dynamic budget alert from period & category totals
  generateBudgetAlert({ categoryName, categoryId, spent, limit, period }) {
    const usage = limit > 0 ? (spent / limit) * 100 : 0;
    const remaining = Math.max(0, limit - spent);
    const periodLabel = period || 'selected period';

    let severity = 'INFO';
    let title = `${categoryName} budget status`;
    let message = `${formatInr(spent)} of ${formatInr(limit)} used for ${periodLabel}.`;

    if (spent > limit) {
      severity = 'CRITICAL';
      title = `${categoryName} budget exceeded!`;
      message = `${formatInr(spent)} spent against ${formatInr(limit)} limit (${formatInr(spent - limit)} over budget).`;
    } else if (usage >= 80) {
      severity = 'WARNING';
      title = `${categoryName} budget is ${Math.round(usage)}% used`;
      message = `${formatInr(spent)} of ${formatInr(limit)} used. Only ${formatInr(remaining)} remaining.`;
    } else {
      severity = 'INFO';
      title = `${categoryName} budget on track`;
      message = `${formatInr(spent)} of ${formatInr(limit)} used. ${formatInr(remaining)} remaining headroom.`;
    }

    return this.createNotification({
      title,
      message,
      category: 'BUDGET',
      severity,
      actionUrl: 'categories',
      metadata: { categoryId, categoryName, spent, limit, period }
    });
  },

  // 9. Notification Preferences
  getPreferences() {
    try {
      const raw = localStorage.getItem(getLocalPrefsKey());
      if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_PREFERENCES;
  },

  async fetchPreferences() {
    try {
      const data = await apiRequest('/api/notifications/preferences');
      if (data) {
        const mapped = {
          emailNotificationsEnabled: data.emailNotificationsEnabled !== false,
          budgetAlerts: data.budgetAlertsEnabled !== false,
          savingsGoals: data.savingsGoalMilestonesEnabled !== false,
          transactions: Boolean(data.expenseConfirmationEnabled || data.incomeNotificationEnabled),
          financialSummaries: data.monthlySummaryEnabled !== false,
          spendingInsights: true,
          securityAlerts: true
        };
        localStorage.setItem(getLocalPrefsKey(), JSON.stringify(mapped));
        window.dispatchEvent(new CustomEvent('fintrack_notification_prefs_updated'));
        return mapped;
      }
    } catch (e) {
      // Offline or network fallback
    }
    return this.getPreferences();
  },

  async savePreferences(prefs) {
    try {
      await apiRequest('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          emailNotificationsEnabled: prefs.emailNotificationsEnabled !== false,
          budgetAlertsEnabled: prefs.budgetAlerts !== false,
          expenseConfirmationEnabled: prefs.transactions === true,
          incomeNotificationEnabled: prefs.transactions === true,
          savingsGoalMilestonesEnabled: prefs.savingsGoals !== false,
          goalDeadlineRemindersEnabled: prefs.savingsGoals !== false,
          monthlySummaryEnabled: prefs.financialSummaries !== false
        })
      });
    } catch (err) {
      console.warn('Backend preferences sync failed (using local cache):', err.message);
    }

    try {
      localStorage.setItem(getLocalPrefsKey(), JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('fintrack_notification_prefs_updated'));
      return prefs;
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      return DEFAULT_PREFERENCES;
    }
  },

  // 10. Trigger Development Test Email
  async sendTestEmail(customNote = '') {
    return await apiRequest('/api/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ customNote })
    });
  },

  // 11. View Delivery Tracking History
  async getDeliveryHistory() {
    try {
      const data = await apiRequest('/api/notifications/deliveries');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // 12. Dispatch Savings Goal Event to Backend
  async recordSavingsGoalEvent(event) {
    try {
      return await apiRequest('/api/notifications/events/goal', {
        method: 'POST',
        body: JSON.stringify(event)
      });
    } catch (e) {
      console.warn('Savings goal event dispatch error:', e.message);
    }
  }
};
