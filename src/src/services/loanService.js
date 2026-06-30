import api from './api';

const loanService = {
  async getLoanTypes() {
    const response = await api.get('/loans/types/');
    return response.data;
  },

  async applyForLoan(data) {
    const response = await api.post('/loans/apply/', data);
    return response.data;
  },

  async getApplications() {
    const response = await api.get('/loans/applications/');
    return response.data;
  },

  async getApplication(id) {
    const response = await api.get(`/loans/applications/${id}/`);
    return response.data;
  },

  async getLoans() {
    const response = await api.get('/loans/');
    return response.data;
  },

  async getLoan(id) {
    const response = await api.get(`/loans/${id}/`);
    return response.data;
  },

  async repayLoan(loanId, data) {
    const response = await api.post(`/loans/${loanId}/repay/`, data);
    return response.data;
  },
};

export default loanService;