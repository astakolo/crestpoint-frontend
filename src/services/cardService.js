import api from './api';

const cardService = {
  async getCards() {
    const response = await api.get('/cards/cards/');
    return response.data;
  },

  async getCard(id) {
    const response = await api.get(`/cards/cards/${id}/`);
    return response.data;
  },

  async createCard(data) {
    const response = await api.post('/cards/cards/', data);
    return response.data;
  },

  async freezeCard(id) {
    const response = await api.post(`/cards/cards/${id}/freeze/`);
    return response.data;
  },

  async unfreezeCard(id) {
    const response = await api.post(`/cards/cards/${id}/unfreeze/`);
    return response.data;
  },

  async addFunds(id, data) {
    const response = await api.post(`/cards/cards/${id}/fund/`, data);
    return response.data;
  },

  async getCardTransactions(id, params = {}) {
    const response = await api.get(`/cards/cards/${id}/transactions/`, { params });
    return response.data;
  },
};

export default cardService;