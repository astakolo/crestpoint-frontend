import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password }, { withCredentials: true });
    const { access, refresh, user } = response.data;
    api.setAuthToken(access);
    return { access, refresh, user };
  },

  async register(data) {
    const response = await api.post('/accounts/register/', data);
    return response.data;
  },

  async logout() {
    try {
      // MUST send cookies so the backend can blacklist the refresh token
      // and delete the httpOnly cookies from the response
      await api.post('/auth/logout/', {}, { withCredentials: true });
    } catch (e) {
      // Ignore logout errors — still clear local state
    } finally {
      api.clearAuthToken();
    }
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh/', {}, { withCredentials: true });
    const { access } = response.data;
    api.setAuthToken(access);
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

  async sendLoginOTP(email, password) {
    const response = await api.post('/auth/otp/send/', { email, password });
    return response.data;
  },

  async verifyLoginOTP(email, otp) {
    const response = await api.post('/auth/otp/verify/', { email, otp }, { withCredentials: true });
    const { access, refresh, user } = response.data;
    api.setAuthToken(access);
    return { access, refresh, user };
  },

  async sendRegisterOTP(email) {
    const response = await api.post('/auth/otp/register/send/', { email });
    return response.data;
  },

  async verifyRegisterOTP(email, otp) {
    const response = await api.post('/auth/otp/register/verify/', { email, otp });
    return response.data;
  },
};

export default authService;
