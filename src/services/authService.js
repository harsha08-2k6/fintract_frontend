import { apiRequest } from './api';
import { saveAuthData, clearAuthData, getStoredToken } from '../utils/tokenUtils';

export const authService = {
  async register(username, email, password, fullName) {
    localStorage.removeItem('fintrack_local_transactions');
    localStorage.removeItem('fintrack_local_expenses');
    localStorage.removeItem('fintrack_local_categories');
    localStorage.removeItem('fintrack_budget_confirmed_month');
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName })
    });
    if (data && data.token) {
      saveAuthData(data.token, data.user);
    }
    return data;
  },

  async login(username, password) {
    localStorage.removeItem('fintrack_local_transactions');
    localStorage.removeItem('fintrack_local_expenses');
    localStorage.removeItem('fintrack_local_categories');
    localStorage.removeItem('fintrack_budget_confirmed_month');
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data && data.token) {
      saveAuthData(data.token, data.user);
    }
    return data;
  },

  async getCurrentUser() {
    return await apiRequest('/api/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async updateProfile(profileData) {
    const updatedUser = await apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (updatedUser) {
      const token = getStoredToken();
      saveAuthData(token, updatedUser);
    }
    return updatedUser;
  },

  async forgotPassword(email) {
    return await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async validateResetToken(token) {
    return await apiRequest('/api/auth/validate-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  async resetPassword(token, newPassword) {
    return await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  logout() {
    clearAuthData();
  }
};

