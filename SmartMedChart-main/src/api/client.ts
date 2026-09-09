import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor — attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Workstation ID header for audit logs
  config.headers['x-workstation'] = 'COW-ICU-084';
  return config;
});

// Response interceptor — handle 401 and refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // If an API request receives an HTML response (e.g. when static Vercel host rewrites /api/* to index.html),
    // treat it as an unavailable endpoint so React Query and services catch it rather than treating HTML as data
    const contentType = response.headers?.['content-type'] || '';
    if (
      typeof response.data === 'string' &&
      (contentType.includes('text/html') || response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html'))
    ) {
      return Promise.reject(new Error('API endpoint returned HTML instead of JSON'));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    // Never retry auth login or refresh requests to avoid loops
    if (!originalRequest || originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const currentUser = localStorage.getItem('user');

      if (!refreshToken) {
        // Only redirect to login if user truly does not have an active session
        if (!currentUser && window.location.pathname !== '/login') {
          localStorage.clear();
          window.location.href = '/login';
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only clear session and redirect if user does not have a valid logged-in profile
        // This prevents kicking logged-in users out when the backend encounters a temporary error
        if (!currentUser && window.location.pathname !== '/login') {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
