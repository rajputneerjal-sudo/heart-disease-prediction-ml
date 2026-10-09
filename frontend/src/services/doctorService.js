import api from './api';

export const doctorService = {
  getProfile: async () => (await api.get('/doctor/profile')).data,
  getAnalytics: async (params = {}) => (await api.get('/doctor/analytics', { params })).data,
  getPatientReports: async ({ search = '', highRiskOnly = false } = {}) =>
    (await api.get('/doctor/patients/reports', { params: { search, high_risk_only: highRiskOnly } })).data,
  deletePatientReport: async (predictionId) =>
    (await api.delete(`/doctor/patients/reports/${predictionId}`)).data,
  getDeletedPatientReports: async ({ search = '' } = {}) =>
    (await api.get('/doctor/patients/bin', { params: { search } })).data,
  restorePatientReport: async (predictionId) =>
    (await api.post(`/doctor/patients/bin/${predictionId}/restore`)).data,
  permanentlyDeletePatientReport: async (predictionId) =>
    (await api.delete(`/doctor/patients/bin/${predictionId}/permanent`)).data,
  emptyDeletedPatientBin: async () =>
    (await api.delete('/doctor/patients/bin/empty')).data,
  getPatients: async ({ search = '' } = {}) =>
    (await api.get('/doctor/patients', { params: { search } })).data,
  getReportHistory: async ({ patientName = '' } = {}) =>
    (await api.get('/reports/doctor/history', { params: { patient_name: patientName } })).data,
  getReportAudit: async () => (await api.get('/reports/audit')).data,
  addRecommendation: async (payload) => (await api.post('/doctor/recommendations', payload)).data,
  getRecommendations: async () => (await api.get('/doctor/recommendations')).data,
  getPatientRecommendations: async () => (await api.get('/doctor/recommendations/patient')).data,
};
