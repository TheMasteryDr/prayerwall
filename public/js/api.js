/**
 * Centralized API Client for Flaming Prayer Wall
 */
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('flaming_auth_token') || localStorage.getItem('grace_auth_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('flaming_auth_token', token);
    } else {
      localStorage.removeItem('flaming_auth_token');
      localStorage.removeItem('grace_auth_token');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  },

  // Auth
  register(payload) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  login(payload) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },

  demoLogin(role) {
    return this.request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) });
  },

  getMe() {
    return this.request('/auth/me');
  },

  updateProfile(payload) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) });
  },

  forgotPassword(email) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  // Overview / Hero
  getOverview() {
    return this.request('/overview');
  },

  // Prayers
  getCategories() {
    return this.request('/prayers/categories');
  },

  getPrayers({ page = 1, limit = 12, category = 'all', sort = 'latest', search = '' }) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      category: category || 'all',
      sort: sort || 'latest',
      search: search || ''
    });
    return this.request(`/prayers?${params.toString()}`);
  },

  getPrayer(id) {
    return this.request(`/prayers/${id}`);
  },

  submitPrayer(payload) {
    return this.request('/prayers', { method: 'POST', body: JSON.stringify(payload) });
  },

  pray(prayerId) {
    return this.request(`/prayers/${prayerId}/pray`, { method: 'POST' });
  },

  addComment(prayerId, payload) {
    return this.request(`/prayers/${prayerId}/comments`, { method: 'POST', body: JSON.stringify(payload) });
  },

  reportPrayer(prayerId, payload) {
    return this.request(`/prayers/${prayerId}/report`, { method: 'POST', body: JSON.stringify(payload) });
  },

  // User Dashboard
  getUserPrayers() {
    return this.request('/user/prayers');
  },

  getUserIntercessions() {
    return this.request('/user/intercessions');
  },

  getUserNotifications() {
    return this.request('/user/notifications');
  },

  markNotificationsRead() {
    return this.request('/user/notifications/read-all', { method: 'POST' });
  },

  updatePrayerStatus(prayerId, status) {
    return this.request(`/user/prayers/${prayerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  // Pastor / Admin
  getAdminStats() {
    return this.request('/admin/stats');
  },

  getAdminPrayers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/admin/prayers?${q}`);
  },

  submitPastorResponse(prayerId, payload) {
    return this.request(`/admin/prayers/${prayerId}/pastor-response`, { method: 'POST', body: JSON.stringify(payload) });
  },

  moderatePrayer(prayerId, action) {
    return this.request(`/admin/prayers/${prayerId}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) });
  },

  getReports() {
    return this.request('/admin/reports');
  },

  updateReport(id, status) {
    return this.request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  getSettings() {
    return this.request('/admin/settings');
  },

  saveSettings(settings) {
    return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) });
  }
};
