import api from './api';

const accountService = {
  async getAccounts() {
    const response = await api.get('/accounts/accounts/');
    return response.data;
  },

  async getAccount(id) {
    const response = await api.get(`/accounts/accounts/${id}/`);
    return response.data;
  },

  async createAccount(data) {
    const response = await api.post('/accounts/accounts/', data);
    return response.data;
  },

  async uploadKYC(formData) {
    const response = await api.post('/accounts/kyc/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getKYCStatus() {
    // Get from user profile
    const response = await api.get('/accounts/profile/');
    return response.data;
  },
};

export default accountService;
