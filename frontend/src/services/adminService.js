import api from './api';

export const adminService = {
  getUsers: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getSystemLogs: async (page = 1, limit = 50) => {
    const response = await api.get(`/admin/logs?page=${page}&limit=${limit}`);
    return response.data;
  },

  getAllPredictions: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/predictions?page=${page}&limit=${limit}`);
    return response.data;
  },
};
