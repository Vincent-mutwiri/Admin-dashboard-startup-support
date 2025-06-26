import api from './api';

const API_URL = '/meetings';

export const getMeetingsByDepartment = async (departmentId, params = {}) => {
  const response = await api.get(`${API_URL}/departments/${departmentId}`, { params });
  return response.data;
};

export const getMyMeetings = async (params = {}) => {
  const response = await api.get(`${API_URL}/my-meetings`, { params });
  return response.data;
};

export const getMeeting = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createMeeting = async (data) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateMeeting = async ({ id, ...data }) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteMeeting = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

export const updateAttendeeStatus = async (meetingId, status) => {
  const response = await api.patch(`${API_URL}/${meetingId}/rsvp`, { status });
  return response.data;
};

export const getMeetingStats = async (departmentId) => {
  const response = await api.get(`${API_URL}/departments/${departmentId}/stats`);
  return response.data;
};
