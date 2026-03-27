// API configuration - uses environment variables when available
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default API_BASE_URL;
