import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // URL base del backend
});

// Interceptor que se ejecuta antes de cada petición HTTP
apiClient.interceptors.request.use(config => {
  // Se obtiene el token JWT almacenado en el navegador
  const token = localStorage.getItem('token');
  // Si existe token, se agrega al header Authorization
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
