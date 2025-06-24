import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  signup: () => Promise.resolve(),
  login: () => Promise.resolve(),
  logout: () => {},
  can: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await api.get('/users/profile');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserStatus();
  }, []);

  const signup = async (userData) => {
    const response = await api.post('/auth/signup', userData);
    setUser(response.data);
  };

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const can = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        can,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;