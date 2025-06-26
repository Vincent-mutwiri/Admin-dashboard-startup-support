// Test authentication status and API access
export const testAuth = async () => {
  try {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return { success: false, message: 'No authentication token found' };
    }

    // Test the API endpoint with the token
    const response = await fetch('http://localhost:5000/api/startups', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API request failed:', data);
      return { success: false, error: data };
    }

    console.log('API response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error testing authentication:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
};

// Run the test when imported
if (typeof window !== 'undefined') {
  console.log('Running auth test...');
  testAuth().then(result => console.log('Test result:', result));
}
