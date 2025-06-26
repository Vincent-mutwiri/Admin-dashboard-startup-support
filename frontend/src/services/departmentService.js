import api from './api';

const API_URL = '/departments';

export const getDepartments = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getDepartmentById = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateDepartment = async ({ id, ...data }) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};
