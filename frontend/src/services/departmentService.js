import api from './api';

const API_URL = '/departments';

export const getDepartments = async () => {
  try {
    console.log('Fetching departments from API...');
    const response = await api.get(API_URL);
    
    // Log the full response for debugging
    console.log('Departments API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      isArray: Array.isArray(response?.data)
    });
    
    // Handle different response formats
    let departments = [];
    
    if (Array.isArray(response.data)) {
      // Case 1: Response data is already an array
      departments = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // Case 2: Response has a data property that's an array
      departments = response.data.data;
    } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
      // Case 3: Response has success and data properties
      departments = response.data.data;
    } else if (response.data) {
      // Case 4: Single department object
      departments = [response.data];
    }
    
    console.log('Processed departments:', departments);
    return departments;
  } catch (error) {
    console.error('Error in getDepartments:', {
      name: error.name,
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      },
      stack: error.stack
    });
    return [];
  }
};

export const getDepartmentById = (id) => api.get(`/departments/${id}`);

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
