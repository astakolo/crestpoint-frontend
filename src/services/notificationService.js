import api from './api';

const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  async markAsRead(notificationIds) {
    const response = await api.post('/notifications/mark-read/', {
      notification_ids: notificationIds,
    });
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },
};

export default notificationService;
