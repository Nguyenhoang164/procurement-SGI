const API_BASE_URL = 'http://localhost:8080/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }
};

// Weekly Plan API
export const weeklyPlanAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch weekly plans');
    return response.json();
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch weekly plan');
    return response.json();
  },
  
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create weekly plan');
    return response.json();
  generateCode: async (market, category) => {
    const params = new URLSearchParams({ market, category });
    const response = await fetch(`${API_BASE_URL}/products/generate-code?${params.toString()}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to generate code');
    return response.text();
  }
  
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update weekly plan');
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete weekly plan');
  }
};

// Purchase Order API
export const purchaseOrderAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch purchase orders');
    return response.json();
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch purchase order');
    return response.json();
  },
  
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create purchase order');
    return response.json();
  },
  
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update purchase order');
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete purchase order');
  }
};

// Payment Request API
export const paymentRequestAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/payment-requests`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch payment requests');
    return response.json();
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payment-requests/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch payment request');
    return response.json();
  },
  
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/payment-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create payment request');
    return response.json();
  },
  
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/payment-requests/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update payment request');
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payment-requests/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete payment request');
  }
};
