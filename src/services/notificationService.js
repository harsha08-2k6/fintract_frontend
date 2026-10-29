import { apiRequest } from './api';

const STORAGE_KEY_PREFS = 'fintrack_notification_preferences';

export const DEFAULT_PREFERENCES = {
  emailNotificationsEnabled: true,
  transactions: false,
  budgetAlerts: true,
  savingsGoals: true,
  financialSummaries: true,
  spendingInsights: true,
  securityAlerts: true
};

const getUserId = () => {
  try {
    const rawUser = localStorage.getItem('spendwise_user_data');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return user?.id || 'guest';
  } catch {
    return 'guest';
  }
};

const getLocalPrefsKey = () => `${STORAGE_KEY_PREFS}_${getUserId()}`;

export const notificationService = {
  async getNotifications(filterCategory = 'ALL') {
    const query = filterCategory !== 'ALL'
      ? `?category=${encodeURIComponent(filterCategory)}`
      : '';
    const data = await apiRequest(`/api/notifications${query}`);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    throw new Error('Notification API returned an invalid response');
  },

  async getUnreadCount() {
    const data = await apiRequest('/api/notifications/unread-count');
    if (!data || typeof data.count !== 'number') {
      throw new Error('Notification API returned an invalid unread count');
    }
    return data.count;
  },

  async markAsRead(id) {
    return apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },

  async markAllAsRead() {
    return apiRequest('/api/notifications/read-all', { method: 'PATCH' });
  },

  async dismissNotification(id) {
    return apiRequest(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async clearAll() {
    return apiRequest('/api/notifications', { method: 'DELETE' });
  },

  getPreferences() {
    try {
      const raw = localStorage.getItem(getLocalPrefsKey());
      if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch (error) {
      console.error('Error reading notification preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  },

  async fetchPreferences() {
    const data = await apiRequest('/api/notifications/preferences');
    if (!data) throw new Error('Notification API returned no preferences');

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
  },

  async savePreferences(prefs) {
    const updated = await apiRequest('/api/notifications/preferences', {
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

    localStorage.setItem(getLocalPrefsKey(), JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('fintrack_notification_prefs_updated'));
    return updated || prefs;
  },

  async sendTestEmail(customNote = '') {
    return apiRequest('/api/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ customNote })
    });
  },

  async getDeliveryHistory() {
    const data = await apiRequest('/api/notifications/deliveries');
    return Array.isArray(data) ? data : [];
  }
};
