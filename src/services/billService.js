import api from './api';

const billService = {
  async getBillers() {
    const response = await api.get('/bills/billers/');
    return response.data;
  },

  async saveBiller(data) {
    const response = await api.post('/bills/billers/', data);
    return response.data;
  },

  async deleteBiller(id) {
    const response = await api.delete(`/bills/billers/${id}/`);
    return response.data;
  },

  async payBill(data) {
    const response = await api.post('/bills/pay/', data);
    return response.data;
  },

  async getPayments(params = {}) {
    const response = await api.get('/bills/payments/', { params });
    return response.data;
  },
};

export default billService;