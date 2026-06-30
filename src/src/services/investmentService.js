import api from './api';

const investmentService = {
  async getMarketStocks() {
    const response = await api.get('/investments/market/');
    return response.data;
  },

  async getStock(pk) {
    // Backend expects integer pk, not symbol string
    const response = await api.get(`/investments/market/${pk}/`);
    return response.data;
  },

  async getInvestmentAccount() {
    const response = await api.get('/investments/account/');
    return response.data;
  },

  async getPortfolio() {
    const response = await api.get('/investments/portfolio/');
    return response.data;
  },

  async buyStock(data) {
    const response = await api.post('/investments/buy/', data);
    return response.data;
  },

  async sellStock(data) {
    const response = await api.post('/investments/sell/', data);
    return response.data;
  },

  async getHistory(params = {}) {
    const response = await api.get('/investments/history/', { params });
    return response.data;
  },

  async depositToInvestment(data) {
    const response = await api.post('/investments/buy/', data);
    return response.data;
  },
};

export default investmentService;