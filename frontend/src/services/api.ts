import axios from 'axios';

// Create an instance of axios with a custom configuration
const api = axios.create({
  // Get the base URL from our environment variables
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Automatically send cookies with every request
  withCredentials: true,
});

// We can also add interceptors here later.
// Interceptors allow you to run code or modify requests/responses
// before they are handled by `then` or `catch`.

// For example, a response interceptor for handling 401 Unauthorized errors:
api.interceptors.response.use(
  (response) => response, // Simply return the successful response
  (error) => {
    // If the error is a 401, we might want to redirect to the login page
    if (error.response && error.response.status === 401) {
      // For now, we'll just log it. We will handle redirection later.
      console.log('Unauthorized, redirecting to login...');
      // window.location.href = '/login';
    }
    // It's important to return a rejected promise to not break the chain
    return Promise.reject(error);
  }
);

export default api;