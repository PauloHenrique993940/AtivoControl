import axios from 'axios';

// Configuração base da API (Porta 3333 onde roda nosso backend)
export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Interceptor para injetar o token de autorização
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});