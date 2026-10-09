import api from './api';

export const consultationService = {
  submitRequest: async (requestData) => {
    const response = await api.post('/consultations/requests', requestData);
    return response.data;
  },
};
