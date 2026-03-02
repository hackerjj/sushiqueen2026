import { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials, AuthResponse, ApiResponse } from '../types';

export function useAuth() {
  const { token, user, setAuth, logout: storeLogout, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      setAuth(data.data.token, data.data.user);
      return true;
    } catch {
      setError('Credenciales inválidas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
  };

  return {
    token,
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: isAuthenticated(),
  };
}
