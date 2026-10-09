import api from './api';

export const chatbotService = {
  sendMessage: async (message) => (await api.post('/chatbot/message', { message })).data,
  getHistory: async () => (await api.get('/chatbot/history')).data,
};
