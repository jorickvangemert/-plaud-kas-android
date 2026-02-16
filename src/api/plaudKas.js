import axios from 'axios';

const API_BASE = 'https://mescalinerabbit.shop/plaudkas/api';

export const plaudKasAPI = {
  // Upload audio file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'audio/m4a',
      name: file.name || 'recording.m4a'
    });

    try {
      const response = await axios.post(`${API_BASE}/upload/simple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          console.log(`Upload progress: ${progress}%`);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Upload mislukt');
    }
  },

  // Get session results
  getResults: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE}/results/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Get results error:', error);
      throw new Error('Resultaten ophalen mislukt');
    }
  },

  // Transcribe audio
  transcribe: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE}/transcribe`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Transcribe error:', error);
      throw new Error('Transcriptie mislukt');
    }
  },

  // Generate summary
  generateSummary: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE}/summary`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Summary error:', error);
      throw new Error('Samenvatting mislukt');
    }
  },

  // Extract action items
  extractActionItems: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE}/extract-actions`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Extract actions error:', error);
      throw new Error('Actiepunten extractie mislukt');
    }
  },

  // Extract decisions
  extractDecisions: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE}/extract-decisions`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Extract decisions error:', error);
      throw new Error('Besluiten extractie mislukt');
    }
  },

  // Export as Word document
  exportDocument: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE}/export`, {
        sessionId
      }, {
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        data: response.data,
        filename: `plaudkas-rapport-${sessionId}.docx`
      };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Export mislukt');
    }
  }
};
