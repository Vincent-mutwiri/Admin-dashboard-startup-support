import api from './api';

export const getStartups = async (params = {}) => {
  try {
    const response = await api.get('/startups', { params });
    // Ensure we always return an array of startups
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching startups:', error);
    throw error;
  }
};
export const createStartup = (data) => api.post('/startups', data);
export const updateStartup = (id, data) => api.put(`/startups/${id}`, data);
export const deleteStartup = (id) => api.delete(`/startups/${id}`);
export const getStartupById = (id) => api.get(`/startups/${id}`);
