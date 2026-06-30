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
};

export default transactionService;
