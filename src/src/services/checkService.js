import api from './api';

const checkService = {
  async depositCheck(formData) {
    const response = await api.post('/checks/deposit/', formData);
    return response.data;
  },

  async getDeposits() {
    const response = await api.get('/checks/');
    return response.data;
  },

  async getDeposit(id) {
    const response = await api.get(`/checks/${id}/`);
    return response.data;
  },
};

export default checkService;