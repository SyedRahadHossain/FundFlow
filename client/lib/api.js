import axios from 'axios';
import { sessionResponseShouldEndSession } from './session';
import { readGatewayUrl } from './readGateway';

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

// A read that never reaches the API - the network dropped it, so there is
// no status and no response - is asked for again through the gateway, which
// carries the same route, the same parameters and the same token in its
// query string. Only once that has failed too does the reader hear about it.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const method = (error?.config?.method || 'get').toLowerCase();

    if (!error?.response && method === 'get' && !error?.config?.gatewayTried) {
      const gateway = readGatewayUrl(url);
      if (gateway) {
        try {
          return await api.get(gateway, { gatewayTried: true });
        } catch {
          // The gateway did not answer either. Fall through: the reader
          // hears about it below, as they would have.
        }
      }
    }

    // A rejected token, or an account that no longer exists, ends the
    // session: the token is dropped and the visitor goes back to the login
    // screen. A failed sign-in attempt is excluded, so a wrong password
    // still surfaces the server's message instead of a redirect loop.
    if (
      sessionResponseShouldEndSession({ status, url }) &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('cf_token');
      if (!window.location.pathname.startsWith('/login')) {
        // A full navigation, not a router push: the app has to drop its auth
        // state and start again from the login screen.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
