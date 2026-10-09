import api from './api';

export const predictionService = {
  predict: async (patientData) => {
    const response = await api.post('/predictions/predict', patientData);
    return response.data;
  },

  getHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/predictions/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPredictionById: async (id) => {
    const response = await api.get(`/predictions/${id}`);
    return response.data;
  },

  deletePrediction: async (id) => {
    const response = await api.delete(`/predictions/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/predictions/dashboard-stats');
    return response.data;
  },

  getModelInfo: async () => {
    const response = await api.get('/predictions/model-info');
    return response.data;
  },

  downloadReport: async (predictionId) => {
    const response = await api.get(`/reports/prediction/${predictionId}/download`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heart_report_${predictionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
