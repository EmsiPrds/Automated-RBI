import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rbi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function getFriendlyMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK')
    return 'Cannot reach server. Make sure the backend is running on the correct port.';
  if (err.code === 'ECONNABORTED') return 'Request timed out. Try again.';
  return err.message || 'Something went wrong.';
}

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const friendly = getFriendlyMessage(err);
    if (err.response?.status === 401) {
      localStorage.removeItem('rbi_token');
      localStorage.removeItem('rbi_user');
      const isAuthPage = typeof window !== 'undefined' && /\/login|\/register/.test(window.location.pathname);
      if (!isAuthPage) window.location.href = '/login';
    }
    return Promise.reject(Object.assign(err, { friendlyMessage: friendly }));
  }
);

export default client;
