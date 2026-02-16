import axios from 'axios';

const API_BASE = 'https://mescalinerabbit.shop/plaudkas/api';

export const openclawAPI = {
  // Send message to Plaud Kas chat endpoint (which uses OpenClaw LLM)
  sendMessage: async (message, context = {}) => {
    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message,
        sessionId: context.sessionId,
        useComplex: false
      });

      return response.data;
    } catch (error) {
      console.error('OpenClaw API error:', error);
      throw new Error('Chat mislukt');
    }
  }
};
