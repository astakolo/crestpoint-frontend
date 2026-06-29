import api from './api';

// ─── Admin User Endpoints ─────────────────────────────────────────────────────

export const adminApi = {
  // User management
  getUsers: (params) => api.get('/accounts/admin/users/', { params }),
  getUserDetail: (id) => api.get(`/accounts/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`/accounts/admin/users/${id}/`, data),
  lockUser: (id, minutes) => api.post(`/accounts/admin/users/${id}/lock/`, { minutes }),
  unlockUser: (id) => api.post(`/accounts/admin/users/${id}/unlock/`),
  verifyUser: (id) => api.post(`/accounts/admin/users/${id}/verify/`),
  deactivateUser: (id) => api.patch(`/accounts/admin/users/${id}/`, { is_active: false }),
  activateUser: (id) => api.patch(`/accounts/admin/users/${id}/`, { is_active: true }),

  // Balance adjustment
  adjustBalance: (userId, data) => api.post(`/accounts/admin/users/${userId}/adjust-balance/`, data),

  // Batch actions
  batchLock: (userIds) => api.post('/accounts/admin/users/batch-lock/', { user_ids: userIds }),
  batchUnlock: (userIds) => api.post('/accounts/admin/users/batch-unlock/', { user_ids: userIds }),

  // Account freeze/unfreeze
  freezeAccount: (accountId) => api.post(`/accounts/accounts/${accountId}/freeze/`),
  unfreezeAccount: (accountId) => api.post(`/accounts/accounts/${accountId}/unfreeze/`),

  // KYC review
  reviewKYC: (data) => api.post('/accounts/kyc/review/', data),

  // Admin notification
  sendNotification: (data) => api.post('/accounts/admin/send-notification/', data),

  // Transactions
  getTransactions: (params) => api.get('/transactions/admin/', { params }),
  getTransactionStats: () => api.get('/transactions/admin/stats/'),
  flagTransaction: (id, reason) => api.post(`/transactions/${id}/flag/`, { reason }),
  unflagTransaction: (id) => api.post(`/transactions/${id}/unflag/`),
  reverseTransaction: (id, reason) => api.post(`/transactions/${id}/reverse/`, { reason }),

  // CSV export (returns blob)
  exportTransactionsCSV: (params) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/transactions/admin/export-csv/${queryString ? `?${queryString}` : ''}`;
    return api.get(url, { responseType: 'blob' });
  },
};

export default adminApi;