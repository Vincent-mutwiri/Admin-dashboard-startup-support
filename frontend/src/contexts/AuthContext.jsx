import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check user status by making a request to /users/me
  const checkUserStatus = async () => {
    try {
      // The withCredentials option ensures cookies are sent with the request
      const { data } = await api.get('/users/me', { withCredentials: true });
      
      if (data.success) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkUserStatus();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      // Make sure withCredentials is true to send/receive cookies
      const { data } = await api.post('/auth/login', credentials, { withCredentials: true });
      
      if (data.success) {
        // Since we're using HTTP-only cookies, we don't need to store the token in localStorage
        // The cookie will be sent automatically with subsequent requests
        
        // Fetch user data - the cookie will be sent automatically
        const userResponse = await api.get('/users/me', { withCredentials: true });
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
          navigate('/dashboard');
          toast.success('Login successful!');
          return true;
        }
      }
      throw new Error(data.message || 'Login failed');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout: async () => {
      setIsLoading(true);
      try {
        // Call the logout endpoint to clear the HTTP-only cookie
        try {
          await api.post('/auth/logout', {}, { withCredentials: true });
        } catch (err) {
          console.warn('Logout API call failed, but continuing with client-side cleanup');
        }
        
        // Clear any client-side state
        setUser(null);
        
        // Redirect to login page
        navigate('/login');
        toast.info('Logged out successfully');
      } catch (err) {
        console.error('Logout error:', err);
        toast.error('Failed to log out');
      } finally {
        setIsLoading(false);
      }
    },
    can: (permission) => {
      if (!user) return false;
      // Add permission logic here
      return true;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;