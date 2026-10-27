import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Access Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('stride_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('stride_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: new_refresh } = res.data;
          localStorage.setItem('stride_access_token', access_token);
          if (new_refresh) {
            localStorage.setItem('stride_refresh_token', new_refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('stride_access_token');
          localStorage.removeItem('stride_refresh_token');
          localStorage.removeItem('stride_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
