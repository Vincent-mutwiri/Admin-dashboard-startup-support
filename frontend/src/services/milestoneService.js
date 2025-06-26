import api from './api';

const API_URL = '/milestones';

export const getMilestonesByDepartment = async (departmentId) => {
  const response = await api.get(`${API_URL}/departments/${departmentId}`);
  return response.data;
};

export const getMilestone = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createMilestone = async (data) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateMilestone = async ({ id, ...data }) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteMilestone = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

export const getMilestonesSummary = async (departmentId) => {
  const response = await api.get(`${API_URL}/departments/${departmentId}/summary`);
  return response.data;
};
