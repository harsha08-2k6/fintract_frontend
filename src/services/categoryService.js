import { apiRequest } from './api';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Food & Dining', icon: 'Utensils', color: '#10B981', budgetLimit: 15000, description: 'Client lunches, team meals, office catering' },
  { id: 2, name: 'Travel & Transport', icon: 'Car', color: '#4F46E5', budgetLimit: 20000, description: 'Flights, cabs, train tickets, fuel allowances' },
  { id: 3, name: 'Software & Cloud SaaS', icon: 'Cloud', color: '#06B6D4', budgetLimit: 35000, description: 'AWS, GitHub, Figma, corporate software tooling' },
  { id: 4, name: 'Office Supplies & Tech', icon: 'Monitor', color: '#F59E0B', budgetLimit: 25000, description: 'Monitors, ergonomic desks, stationery, hardware' },
  { id: 5, name: 'Client Entertainment', icon: 'Coffee', color: '#EC4899', budgetLimit: 12000, description: 'Corporate events, client gifting, partner summits' },
  { id: 6, name: 'Utilities & Facilities', icon: 'Zap', color: '#8B5CF6', budgetLimit: 10000, description: 'High-speed internet, electricity, facility maintenance' }
];

function getLocalCategories() {
  const data = localStorage.getItem('fintrack_local_categories');
  if (!data) {
    localStorage.setItem('fintrack_local_categories', JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveLocalCategories(cats) {
  localStorage.setItem('fintrack_local_categories', JSON.stringify(cats));
}

export const categoryService = {
  async getAllCategories() {
    try {
      return await apiRequest('/api/categories');
    } catch {
      return getLocalCategories();
    }
  },

  async getCategoryById(id) {
    try {
      return await apiRequest(`/api/categories/${id}`);
    } catch {
      const cats = getLocalCategories();
      return cats.find(c => c.id === parseInt(id)) || cats[0];
    }
  },

  async createCategory(categoryData) {
    try {
      return await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
    } catch {
      const cats = getLocalCategories();
      const newCat = {
        id: Date.now(),
        ...categoryData,
        budgetLimit: parseFloat(categoryData.budgetLimit) || 10000
      };
      cats.push(newCat);
      saveLocalCategories(cats);
      return newCat;
    }
  },

  async updateCategory(id, categoryData) {
    try {
      return await apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
    } catch {
      let cats = getLocalCategories();
      cats = cats.map(c => c.id === parseInt(id) ? { ...c, ...categoryData, budgetLimit: parseFloat(categoryData.budgetLimit) || c.budgetLimit } : c);
      saveLocalCategories(cats);
      return cats.find(c => c.id === parseInt(id));
    }
  },

  async deleteCategory(id) {
    try {
      return await apiRequest(`/api/categories/${id}`, {
        method: 'DELETE'
      });
    } catch {
      let cats = getLocalCategories();
      cats = cats.filter(c => c.id !== parseInt(id));
      saveLocalCategories(cats);
      return null;
    }
  }
};
