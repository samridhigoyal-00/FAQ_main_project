import axios from 'axios';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default api;
export { API_BASE };