import api from './api';

const checkService = {
  async depositCheck(formData) {
    const response = await api.post('/checks/deposits/', formData);
    return response.data;
  },

  async getDeposits() {
    const response = await api.get('/checks/deposits/');
    return response.data;
  },

  async getDeposit(id) {
    const response = await api.get(`/checks/deposits/${id}/`);
    return response.data;
  },
};

export default checkService;