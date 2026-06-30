import api from './api';

const paymentService = {
  async initiatePayment(data) {
    const response = await api.post('/payments/initiate/', data);
    return response.data;
  },

  async getPayments(params = {}) {
    const response = await api.get('/payments/', { params });
    return response.data;
  },

  async getPayment(id) {
    const response = await api.get(`/payments/${id}/`);
    return response.data;
  },

  async verifyPayment(id) {
    const response = await api.post(`/payments/${id}/verify/`);
    return response.data;
  },
};

export default paymentService;
