import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const register = useCallback(async (data) => {
    const response = await authService.register(data);
    // Auto-login after registration
    if (response.email && data.password) {
      await login(response.email, data.password);
    }
    return response;
  }, [login]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

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
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
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
