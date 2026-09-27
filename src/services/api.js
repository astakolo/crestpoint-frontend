import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.crestpointcredit.online';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // JWT in Authorization header, no cookies needed
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token is stored in memory and set via setAuthToken
    const token = api._accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints that must NOT trigger a refresh attempt.
// These are "pre-auth" or "auth-flow" routes — a 401 here is the real answer
// (wrong password, KYC pending, locked account, expired reset token, etc.),
// not a signal to silently refresh.
const AUTH_ENDPOINTS = [
  '/auth/login/',
  '/auth/refresh/',
  '/auth/logout/',
  '/auth/otp/',
  '/auth/password-reset/',
  '/accounts/register/',
];

function isAuthEndpoint(url) {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isAuthRoute = isAuthEndpoint(originalRequest?.url);
    const hasAccessToken = !!api._accessToken;

    // Only attempt a refresh when ALL of these are true:
    //   1. The original request returned 401
    //   2. We haven't already retried this request (prevents infinite loops)
    //   3. The failing request is NOT an auth-flow endpoint (login, refresh,
    //      register, password-reset, OTP) — those 401s are the real answer
    //   4. We actually had an access token in memory (i.e. the user was logged
    //      in). If there's no token, there's nothing to refresh from.
    if (is401 && !alreadyRetried && !isAuthRoute && hasAccessToken) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token. Use the raw axios instance so we don't
        // re-enter this interceptor if /auth/refresh/ itself returns 401.
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );
        const { access } = response.data;
        api.setAuthToken(access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — dispatch event so AuthContext can clean up and
        // React Router handles redirect. Reject with the ORIGINAL error so
        // the calling code sees the real message, not "Refresh token is
        // required".
        api.clearAuthToken();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Module-level token storage (NOT localStorage - security requirement)
api._accessToken = null;
api.setAuthToken = (token) => {
  api._accessToken = token;
};
api.clearAuthToken = () => {
  api._accessToken = null;
};

export default api;
