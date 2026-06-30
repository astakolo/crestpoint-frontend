import api from './api';

const cryptoService = {
  async getWallet() {
    const response = await api.get('/crypto/wallet/');
    return response.data;
  },

  async createDeposit(data) {
    const response = await api.post('/crypto/deposits/', data);
    return response.data;
  },

  async getTransactions() {
    const response = await api.get('/crypto/transactions/');
    return response.data;
  },
};

export default cryptoService;