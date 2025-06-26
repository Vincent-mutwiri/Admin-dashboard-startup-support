import api from './api';

export const getResourcesByDepartment = async (departmentId, params = {}) => {
  const response = await api.get(`/departments/${departmentId}/resources`, { params });
  return response;
};

export const getResource = async (id) => {
  const response = await api.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (data) => {
  const response = await api.post('/resources', data);
  return response.data;
};

export const updateResource = async ({ id, ...data }) => {
  const response = await api.put(`/resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`);
  return response.data;
};

export const getResourceStats = async (departmentId) => {
  const response = await api.get(`/departments/${departmentId}/resources/stats`);
  return response;
};
