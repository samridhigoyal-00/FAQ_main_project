// frontend/src/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 1. REQUEST INTERCEPTOR: Automatically attach the token to every outgoing request
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

// 2. RESPONSE INTERCEPTOR: Globally handle expired tokens (401 errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend rejects the token, clear it and force a log out
      localStorage.removeItem('token');
      
      // Only redirect if we are not already on the login or home page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// We keep this here just in case older parts of your code still import it,
// but you won't need to use it anymore!
export const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default api;
export { API_BASE };