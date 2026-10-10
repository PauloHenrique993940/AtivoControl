import axios from 'axios';

// Configuração base da API (Porta 3333 onde roda nosso backend)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) window.dispatchEvent(new Event('session:expired'));
  return Promise.reject(error);
});

// Interceptor para injetar o token de autorização
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
