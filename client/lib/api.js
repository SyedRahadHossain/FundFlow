import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '[api] NEXT_PUBLIC_API_URL is not set. API requests will be sent to http://localhost:5000 and will fail in production.'
  );
}

const api = axios.create({
  baseURL,
  timeout: 20000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the stored token is stale or invalid. Drop it and send the user
// back to the login screen. Login/register requests are excluded so a bad
// password still surfaces the server's message instead of a redirect loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthAttempt = url.includes('/api/auth/');

    if (status === 401 && !isAuthAttempt && typeof window !== 'undefined') {
      localStorage.removeItem('cf_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
