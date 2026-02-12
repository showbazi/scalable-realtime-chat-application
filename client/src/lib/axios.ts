import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false, // We handle tokens manually, so we don't need cookies
});

// Interceptor: Automatically add Token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;