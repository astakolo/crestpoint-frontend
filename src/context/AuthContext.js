import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = useCallback(async (email, password) => {
    const { access, user: userData } = await authService.login(email, password);
    setUser(userData);
    return userData;
  }, []);

  const loginWithTokens = useCallback(async ({ access, user: userData }) => {
    api.setAuthToken(access);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authService.register(data);
    // Auto-login after registration
    if (response.email && data.password) {
      await login(response.email, data.password);
    }
    return response;
  }, [login]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const access = await authService.refreshToken();
      return access;
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const access = await authService.refreshToken();
      api.setAuthToken(access);
      const profile = await authService.getProfile();
      setUser(profile);
      return true;
    } catch (error) {
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Proactive token refresh: every 12 minutes (before the 15-min JWT expiry)
  const refreshTimerRef = useRef(null);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(async () => {
      try {
        const access = await authService.refreshToken();
        api.setAuthToken(access);
      } catch (error) {
        // Silent refresh failed — let the next request's 401 interceptor handle it
      }
    }, 12 * 60 * 1000); // 12 minutes
  }, []);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Initial auth check and start refresh timer when authenticated
  useEffect(() => {
    checkAuth().then((success) => {
      if (success) {
        startRefreshTimer();
      }
    });
    return () => {
      stopRefreshTimer();
    };
    // eslint-disable-next-line
  }, []);

  // Start/stop refresh timer when authentication state changes
  useEffect(() => {
    if (user) {
      startRefreshTimer();
    } else {
      stopRefreshTimer();
    }
    return () => {
      stopRefreshTimer();
    };
  }, [user, startRefreshTimer, stopRefreshTimer]);

  // Listen for auth:logout events dispatched by the api.js 401 interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      stopRefreshTimer();
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [stopRefreshTimer]);

  const logout = useCallback(async () => {
    stopRefreshTimer();
    await authService.logout();
    setUser(null);
  }, [stopRefreshTimer]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithTokens,
    register,
    logout,
    refreshAccessToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
