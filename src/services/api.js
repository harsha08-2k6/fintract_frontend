import { getStoredToken, getStoredUser } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

/**
 * Universal API request wrapper for FinTrack Gateway communication
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const user = getStoredUser();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (user && user.id) {
    headers['X-User-Id'] = user.id.toString();
  }

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status}: Request failed`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiRequest;
