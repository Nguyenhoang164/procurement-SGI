import { API_BASE_URL, getHeaders } from './api';

const BASE = `${API_BASE_URL}/users`;

export const userAPI = {
  getAll: async () => {
    const res = await fetch(BASE, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${BASE}/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
  },

  deactivate: async (id) => {
    const res = await fetch(`${BASE}/${id}/deactivate`, { method: 'PUT', headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
  }
};
