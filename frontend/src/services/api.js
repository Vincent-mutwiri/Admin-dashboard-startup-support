import axios from 'axios';

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: '/api', // This will be proxied to http://localhost:5000/api in development
  withCredentials: true, // Important for sending/receiving cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure credentials are sent with cross-origin requests
  crossDomain: true,
  // Don't modify the response data
  transformResponse: [function (data) {
    return data ? JSON.parse(data) : data;
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
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Clear any existing tokens
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
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
