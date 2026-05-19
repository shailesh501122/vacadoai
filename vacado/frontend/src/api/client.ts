import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach JWT from localStorage if present (cookie auth also works).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vacado_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && location.pathname.startsWith('/dashboard')) {
      localStorage.removeItem('vacado_token');
      location.href = '/login';
    }
    return Promise.reject(err);
  },
);
