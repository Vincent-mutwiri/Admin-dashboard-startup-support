import api from './api';

export const getCommentsByMilestone = async (milestoneId) => {
  try {
    const response = await api.get(`/milestones/${milestoneId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const addComment = async (data) => {
  try {
    console.log('Sending comment data:', data);
    
    // Ensure we have the required fields
    if (!data.milestoneId || !data.text) {
      throw new Error('Missing required fields: milestoneId and text are required');
    }
    
    const response = await api.post(
      `/milestones/${data.milestoneId}/comments`,
      { text: data.text },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Comment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in addComment:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
};

export const updateComment = async ({ id, text }) => {
  try {
    const response = await api.put(`/milestones/comments/${id}`, { text });
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (id) => {
  try {
    const response = await api.delete(`/milestones/comments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
