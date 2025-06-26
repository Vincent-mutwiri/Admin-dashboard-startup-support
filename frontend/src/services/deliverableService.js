import api from './api';

export const getDeliverablesByMilestone = async (milestoneId) => {
  try {
    const response = await api.get(`/deliverables/milestone/${milestoneId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
};

export const createDeliverable = async (data) => {
  try {
    const response = await api.post('/deliverables', data);
    return response.data;
  } catch (error) {
    console.error('Error creating deliverable:', error);
    throw error;
  }
};

export const updateDeliverable = async ({ id, ...data }) => {
  try {
    const response = await api.put(`/deliverables/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating deliverable:', error);
    throw error;
  }
};

export const deleteDeliverable = async (id) => {
  try {
    const response = await api.delete(`/deliverables/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    throw error;
  }
};
