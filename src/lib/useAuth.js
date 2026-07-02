import { useState, useEffect } from 'react';
import { authService } from './auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data, error } = await authService.login(email, password);
    if (data) setUser(data);
    return { data, error };
  };

  const register = async (email, password, name) => {
    const { data, error } = await authService.register(email, password, name);
    if (data) setUser(data);
    return { data, error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
