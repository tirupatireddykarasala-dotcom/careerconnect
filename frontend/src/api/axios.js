/**
 * api/axios.js
 *
 * WHY ONE SHARED AXIOS INSTANCE: every API call in the app needs the same
 * base URL and the same "attach the JWT, and silently refresh it if it
 * expired" behavior. Configuring that once here means every page/component
 * just imports `api` and calls api.get(...)/api.post(...) without repeating
 * auth logic.
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the access token to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// WHY A RESPONSE INTERCEPTOR: JWT access tokens expire (after 60 minutes
// here). Rather than forcing the user to log in again every hour, we catch
// a single 401, use the longer-lived refresh token to get a new access
// token, retry the original request once, and only log the user out if the
// refresh token itself has also expired.
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/login/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

/**
 * A small helper used throughout the app to turn our backend's consistent
 * {error, details} shape (see careerconnect/exceptions.py) into one readable
 * string for a toast/alert box.
 */
export function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return 'Something went wrong. Please check your connection and try again.';
  if (data.details && typeof data.details === 'object') {
    const firstKey = Object.keys(data.details)[0];
    const firstVal = data.details[firstKey];
    if (Array.isArray(firstVal)) return `${firstKey}: ${firstVal[0]}`;
    if (typeof firstVal === 'string') return firstVal;
  }
  return data.error || 'Something went wrong.';
}
