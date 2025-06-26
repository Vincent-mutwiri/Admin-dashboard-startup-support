import axios from 'axios';

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend server URL with /api prefix
  withCredentials: true, // Important for sending/receiving cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure credentials are sent with cross-origin requests
  crossDomain: true,
  // Don't modify the response data
  transformResponse: [function (data) {
    try {
      return data ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Error parsing response:', error);
      return data;
    }
  }]
});

// Set withCredentials to true by default for all requests
api.defaults.withCredentials = true;

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Parse the response data if it's a string
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error('Error parsing response data:', e);
      }
    }
    return response;
  },
  (error) => {
    // Handle any response errors
    if (error.response) {
      const { status, data } = error.response;
      
      console.error('Response error:', {
        status,
        statusText: error.response.statusText,
        data,
        url: error.config?.url
      });
      
      // Only handle 401 for specific authentication endpoints
      if (status === 401) {
        // Only redirect to login if we're not already on the login page
        // and it's not an API endpoint that might return 401 for other reasons
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        const isLoginPage = window.location.pathname === '/login';
        
        if (!isAuthEndpoint && !isLoginPage) {
          // Only clear tokens if we're sure it's a session expiration
          if (data?.message?.toLowerCase().includes('expired') || 
              data?.error?.toLowerCase().includes('expired') ||
              data?.message?.toLowerCase().includes('invalid token') ||
              data?.error?.toLowerCase().includes('invalid token')) {
            if (typeof window !== 'undefined') {
              // Clear any stored tokens
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
              // Redirect to login with session expired flag
              window.location.href = '/login?session=expired';
            }
            // Don't continue with the error chain
            return Promise.reject({ isHandled: true });
          }
        }
      }
      
      // For 404s, just log and continue
      if (status === 404) {
        console.warn('Resource not found:', error.config?.url);
        // Don't redirect, just reject with the error
        return Promise.reject(error);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests for debugging
    console.log('Making request to:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('Response from:', response.config.url, response.status);
    return response;
  },
  (error) => {
    // Log error responses
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        url: error.config.url,
        data: error.response.data,
      });
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          // Clear the invalid token
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          
          // Redirect to login with a message
          window.location.href = '/login?sessionExpired=true';
        }
      }
      if (error.response.status === 401) {
        console.log('Unauthorized, letting AuthContext handle it.');
        // The AuthContext will catch this error and handle the user state and redirection.
        // No need to force a redirect here.
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
