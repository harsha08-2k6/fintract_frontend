import { apiRequest } from './api';

export const categoryService = {
  async getAllCategories() {
    return apiRequest('/api/categories');
  },

  async getCategoryById(id) {
    return apiRequest(`/api/categories/${id}`);
  },

  async createCategory(categoryData) {
    return apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  async updateCategory(id, categoryData) {
    return apiRequest(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },

  async deleteCategory(id) {
    return apiRequest(`/api/categories/${id}`, {
      method: 'DELETE'
    });
  }
};
