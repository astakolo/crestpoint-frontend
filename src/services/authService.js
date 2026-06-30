import api from './api';

// Store refresh token in memory as fallback when cookies are unavailable
let _refreshToken = null;

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    api.setAuthToken(access);
    _refreshToken = refresh; // Store in memory as fallback
    api._refreshToken = refresh; // Also store on api for the 401 interceptor
    return { access, refresh, user };
  },

  async register(data) {
    const response = await api.post('/accounts/register/', data);
    return response.data;
  },

  async logout() {
    try {
      // Send refresh token in body as fallback
      await api.post('/auth/logout/', _refreshToken ? { refresh: _refreshToken } : {});
    } catch (e) {
      // Ignore logout errors
    } finally {
      api.clearAuthToken();
      _refreshToken = null;
      api._refreshToken = null;
    }
  },

  async refreshToken() {
    // Send refresh token in body if we have it (fallback for when cookies fail)
    const body = _refreshToken ? { refresh: _refreshToken } : {};
    const response = await api.post('/auth/refresh/', body, { withCredentials: true });
    const { access, refresh } = response.data;
    api.setAuthToken(access);
    if (refresh) {
      _refreshToken = refresh; // Update stored refresh token (rotation)
      api._refreshToken = refresh; // Keep api in sync
    }
    return access;
  },

  async getProfile() {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/accounts/profile/', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await api.post('/accounts/change-password/', data);
    return response.data;
  },

  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/request/', { email });
    return response.data;
  },

  async confirmPasswordReset(data) {
    const response = await api.post('/auth/password-reset/confirm/', data);
    return response.data;
  },
};

export default authService;
