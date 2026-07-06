const API_BASE = 'https://safarmeals.onrender.com/api';
/**
 * Custom fetch client that matches standard Axios APIs,
 * but runs purely in-browser and fallback-ready.
 */
const api = {
  // GET requests
  get: async (url, config = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return { data };
  },

  // POST requests
  post: async (url, body = {}, config = {}) => {
    const isFormData = body instanceof FormData;
    const headers = { ...config.headers };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      // Pass conflict variables if present
      if (response.status === 409 && data.conflict) {
        return { data, status: response.status };
      }
      throw new Error(data.message || 'API request failed');
    }
    return { data, status: response.status };
  },

  // PUT requests
  put: async (url, body = {}, config = {}) => {
    const isFormData = body instanceof FormData;
    const headers = { ...config.headers };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers,
      body: isFormData ? body : JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return { data };
  },

  // DELETE requests
  delete: async (url, config = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return { data };
  }
};

export default api;
export { API_BASE };
