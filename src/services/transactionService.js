import api from './api';

const transactionService = {
  async deposit(data) {
    const response = await api.post('/transactions/deposit/', data);
    return response.data;
  },

  async withdraw(data) {
    const response = await api.post('/transactions/withdraw/', data);
    return response.data;
  },

  async transfer(data) {
    const response = await api.post('/transactions/transfer/', data);
    return response.data;
  },

  async getHistory(params = {}) {
    const response = await api.get('/transactions/history/', { params });
    return response.data;
  },

  async getTransaction(id) {
    const response = await api.get(`/transactions/${id}/`);
    return response.data;
  },

  // ── Withdrawal Requests ──

  async createWithdrawalRequest(data) {
    const response = await api.post('/transactions/withdrawal-requests/', data);
    return response.data;
  },

  async getWithdrawalRequests(params = {}) {
    const response = await api.get('/transactions/withdrawal-requests/list/', { params });
    return response.data;
  },

  async getWithdrawalRequest(id) {
    const response = await api.get(`/transactions/withdrawal-requests/${id}/`);
    return response.data;
  },

  // ── Admin: Withdrawal Requests ──

  async adminGetWithdrawalRequests(params = {}) {
    const response = await api.get('/transactions/withdrawal-requests/admin/', { params });
    return response.data;
  },

  async adminReviewWithdrawal(id, data) {
    const response = await api.post(`/transactions/withdrawal-requests/${id}/review/`, data);
    return response.data;
  },
};

export default transactionService;
