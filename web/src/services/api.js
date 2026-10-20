import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Normaliza los errores de axios para que la UI siempre reciba
 * un Error con `message` legible y `status` (si existe).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const status = error.response?.status ?? null;
    let message = error.response?.data?.message;

    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'La solicitud tardó demasiado. Intente nuevamente.';
      else if (!error.response) message = 'No se pudo conectar con el servidor.';
      else message = 'Ocurrió un error inesperado.';
    }

    const normalized = new Error(message);
    normalized.status = status;
    normalized.original = error;
    return Promise.reject(normalized);
  },
);

export default api;
