const getBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  const host = window.location.hostname;
  const port = window.location.port === '3000' ? '8080' : window.location.port;
  return `${window.location.protocol}//${host}:${port}/api/v1`;
};

const getOrigin = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl.replace('/v1', '');
  const host = window.location.hostname;
  const port = window.location.port === '3000' ? '8080' : window.location.port;
  return `${window.location.protocol}//${host}:${port}/api`;
};

export const API_BASE_URL = getBaseUrl();
export const API_ORIGIN = getOrigin();

export const resolveFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
};

export const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Yêu cầu thất bại với mã ${response.status}`);
  }
  return response.json();
};

const requestText = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Yêu cầu thất bại với mã ${response.status}`);
  }
  return response.text();
};

export const authAPI = {
  login: async (username, password) =>
    requestJson(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }),
  register: async (username, password, market) =>
    requestJson(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, market })
    }),
  checkSession: async () =>
    requestJson(`${API_BASE_URL}/auth/me`, { headers: getHeaders() })
};

export const weeklyPlanAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/weekly-plans`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/weekly-plans/${id}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/weekly-plans`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/weekly-plans/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/weekly-plans/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa kế hoạch tuần thất bại');
  },
  submit: async (id) => requestJson(`${API_BASE_URL}/weekly-plans/${id}/submit`, {
    method: 'POST', headers: getHeaders()
  }),
  approveL1: async (id) => requestJson(`${API_BASE_URL}/weekly-plans/${id}/approve-l1`, {
    method: 'POST', headers: getHeaders()
  }),
  approveL2: async (id) => requestJson(`${API_BASE_URL}/weekly-plans/${id}/approve-l2`, {
    method: 'POST', headers: getHeaders()
  }),
  reject: async (id) => requestJson(`${API_BASE_URL}/weekly-plans/${id}/reject`, {
    method: 'POST', headers: getHeaders()
  })
};

export const purchaseOrderAPI = {
  getAll: async (department, page = 0, size = 10, startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    if (department) params.set('department', department);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('page', page);
    params.set('size', size);
    return requestJson(`${API_BASE_URL}/purchase-orders?${params.toString()}`, { headers: getHeaders() });
  },
  getById: async (id) => requestJson(`${API_BASE_URL}/purchase-orders/${id}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/purchase-orders`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/purchase-orders/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa đơn hàng thất bại');
  },
  deleteAll: async () => {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa tất cả đơn hàng thất bại');
  },
  importExcel: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/purchase-orders/import/excel`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Import Excel thất bại');
    return result;
  },
  approveL1: async (id) => requestJson(`${API_BASE_URL}/purchase-orders/${id}/approve-l1`, {
    method: 'POST', headers: getHeaders()
  }),
  reject: async (id, reason, rejectedBy) => {
    const params = new URLSearchParams();
    if (reason) params.set('reason', reason);
    if (rejectedBy) params.set('rejectedBy', rejectedBy);
    const query = params.toString();
    const url = query ? `${API_BASE_URL}/purchase-orders/${id}/reject?${query}` : `${API_BASE_URL}/purchase-orders/${id}/reject`;
    return requestJson(url, { method: 'POST', headers: getHeaders() });
  },
  updateStatus: async (id, status) => {
    const params = new URLSearchParams({ status });
    return requestJson(`${API_BASE_URL}/purchase-orders/${id}/status?${params.toString()}`, {
      method: 'POST', headers: getHeaders()
    });
  },
  search: async (keyword, department, startDate = '', endDate = '') => {
    let url = `${API_BASE_URL}/purchase-orders/search?keyword=${encodeURIComponent(keyword)}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    return requestJson(url, { headers: getHeaders() });
  },
  importOrders: async (orders) => requestJson(`${API_BASE_URL}/purchase-orders/import`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(orders)
  }),
  getDepartments: async () => requestJson(`${API_BASE_URL}/purchase-orders/departments`, { headers: getHeaders() })
};

export const paymentRequestAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/payment-requests`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/payment-requests/${id}`, { headers: getHeaders() }),
  search: async (keyword) => requestJson(`${API_BASE_URL}/payment-requests/search?keyword=${encodeURIComponent(keyword)}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/payment-requests`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/payment-requests/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payment-requests/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa đề nghị thanh toán thất bại');
  },
  approveL1: async (id) => requestJson(`${API_BASE_URL}/payment-requests/${id}/approve-l1`, {
    method: 'POST', headers: getHeaders()
  }),
  approveL2: async (id) => requestJson(`${API_BASE_URL}/payment-requests/${id}/approve-l2`, {
    method: 'POST', headers: getHeaders()
  }),
  accountingCheck: async (id, checkedBy) => {
    const params = new URLSearchParams({ checkedBy });
    return requestJson(`${API_BASE_URL}/payment-requests/${id}/accounting-check?${params.toString()}`, {
      method: 'POST', headers: getHeaders()
    });
  },
  reject: async (id, reason, rejectedBy) => {
    const params = new URLSearchParams({ reason: reason || '', rejectedBy: rejectedBy || '' });
    return requestJson(`${API_BASE_URL}/payment-requests/${id}/reject?${params.toString()}`, {
      method: 'POST', headers: getHeaders()
    });
  },
  pay: async (id, confirmedBy, bankAccountId) => {
    const params = new URLSearchParams();
    if (confirmedBy) params.set('confirmedBy', confirmedBy);
    if (bankAccountId) params.set('bankAccountId', bankAccountId);
    return requestJson(`${API_BASE_URL}/payment-requests/${id}/pay?${params.toString()}`, {
      method: 'POST', headers: getHeaders()
    });
  },
  getExchangeRateDiff: async (id) => requestJson(`${API_BASE_URL}/payment-requests/${id}/exchange-rate-diff`, {
    headers: getHeaders()
  }),
  confirmPayment: async (id, confirmedBy) => {
    const params = new URLSearchParams({ confirmedBy });
    return requestJson(`${API_BASE_URL}/payment-requests/${id}/confirm-payment?${params.toString()}`, {
      method: 'POST', headers: getHeaders()
    });
  },
  uploadAttachments: async (id, files) => {
    if (!files?.length) return null;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file, file.name));
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/payment-requests/${id}/attachments`, {
      method: 'POST', headers, body: formData
    });
    if (!response.ok) {
      let message = 'Tải file minh chứng thất bại';
      try { const errBody = await response.json(); message = errBody.message || message; }
      catch { const text = await response.text(); if (text) message = text; }
      throw new Error(message);
    }
    return response.json();
  }
};

export const warehouseAPI = {
  getPending: async () => requestJson(`${API_BASE_URL}/warehouse-receipts/pending`, { headers: getHeaders() }),
  receive: async (data) => requestJson(`${API_BASE_URL}/warehouse-receipts/receive`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  getAll: async () => requestJson(`${API_BASE_URL}/warehouse-receipts`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/warehouse-receipts/${id}`, { headers: getHeaders() }),
  uploadImages: async (id, files) => {
    if (!files?.length) return null;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file, file.name));
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/warehouse-receipts/${id}/images`, {
      method: 'POST', headers, body: formData
    });
    if (!response.ok) {
      let message = 'Tải ảnh lên thất bại';
      try { const errBody = await response.json(); message = errBody.message || message; }
      catch { const text = await response.text(); if (text) message = text; }
      throw new Error(message);
    }
    return response.json();
  },
  uploadItemImages: async (receiptId, itemId, files) => {
    if (!files?.length) return null;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file, file.name));
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/warehouse-receipts/${receiptId}/items/${itemId}/images`, {
      method: 'POST', headers, body: formData
    });
    if (!response.ok) {
      let message = 'Tải ảnh sản phẩm thất bại';
      try { const errBody = await response.json(); message = errBody.message || message; }
      catch { const text = await response.text(); if (text) message = text; }
      throw new Error(message);
    }
    return response.json();
  }
};

export const exchangeRateAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/exchange-rates`, { headers: getHeaders() }),
  getByCurrency: async (currency) => requestJson(`${API_BASE_URL}/exchange-rates/${currency}`, { headers: getHeaders() }),
  save: async (currency, data) => requestJson(`${API_BASE_URL}/exchange-rates/${currency}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  })
};

export const productCostAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/product-costs`, { headers: getHeaders() }),
  getAllAlerts: async () => requestJson(`${API_BASE_URL}/product-costs/alerts`, { headers: getHeaders() }),
  getAlertsByPosCode: async (posCode) => requestJson(`${API_BASE_URL}/product-costs/alerts/${encodeURIComponent(posCode)}`, { headers: getHeaders() }),
  delete: async (posCode) => {
    const response = await fetch(`${API_BASE_URL}/product-costs/${encodeURIComponent(posCode)}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa giá vốn thất bại');
  },
  deleteAll: async () => {
    const response = await fetch(`${API_BASE_URL}/product-costs`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa tất cả giá vốn thất bại');
  }
};

export const productAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/products`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/products/${id}`, { headers: getHeaders() }),
  getByPosCode: async (posCode) => requestJson(`${API_BASE_URL}/products/by-pos-code/${encodeURIComponent(posCode)}`, { headers: getHeaders() }),
  search: async (query) => requestJson(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query)}`, { headers: getHeaders() }),
  generateCode: async (market, productName, department, iteration = 0) => {
    const params = new URLSearchParams({ market, productName, category: productName, department: department || '', iteration: String(iteration) });
    return requestText(`${API_BASE_URL}/products/generate-code?${params.toString()}`, {
      method: 'GET', headers: getHeaders()
    });
  },
  create: async (data) => requestJson(`${API_BASE_URL}/products`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa sản phẩm thất bại');
  },
  importExcel: async (products) => requestJson(`${API_BASE_URL}/products/import`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(products)
  }),
  batchDelete: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/products/batch-delete`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(ids)
    });
    if (!response.ok) throw new Error('Xóa hàng loạt thất bại');
  },
  deleteAll: async () => {
    const response = await fetch(`${API_BASE_URL}/products/delete-all`, {
      method: 'DELETE', headers: getHeaders()
    });
    if (!response.ok) throw new Error('Xóa toàn bộ sản phẩm thất bại');
  },
  regenerateCodes: async () => {
    const response = await fetch(`${API_BASE_URL}/products/regenerate-codes`, {
      method: 'POST', headers: getHeaders()
    });
    if (!response.ok) throw new Error('Cập nhật mã sản phẩm thất bại');
    return response.json();
  }
};

export const productComboAPI = {
  getByProduct: async (productId) => requestJson(`${API_BASE_URL}/products/${productId}/combos`, { headers: getHeaders() }),
  create: async (productId, data) => requestJson(`${API_BASE_URL}/products/${productId}/combos`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (productId, comboId, data) => requestJson(`${API_BASE_URL}/products/${productId}/combos/${comboId}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (productId, comboId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/combos/${comboId}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa combo thất bại');
  }
};

export const waybillAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/waybills`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/waybills/${id}`, { headers: getHeaders() }),
  getByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    return Promise.all(ids.map(id => waybillAPI.getById(id)));
  },
  getByPaymentRequestId: async (paymentRequestId) => requestJson(`${API_BASE_URL}/waybills/by-payment-request/${paymentRequestId}`, { headers: getHeaders() }),
  search: async (keyword) => requestJson(`${API_BASE_URL}/waybills/search?keyword=${encodeURIComponent(keyword)}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/waybills`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/waybills/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  confirmDelivery: async (id) => requestJson(`${API_BASE_URL}/waybills/${id}/confirm`, {
    method: 'PUT', headers: getHeaders()
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/waybills/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa vận đơn thất bại');
  }
};

export const shipmentTrackingAPI = {
  getByWaybillId: async (waybillId) => requestJson(`${API_BASE_URL}/shipment-trackings/waybill/${waybillId}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/shipment-trackings`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  })
};

export const costCommentAPI = {
  getByPoId: async (poId) => requestJson(`${API_BASE_URL}/cost-comments/po/${poId}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/cost-comments`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  })
};

export const bankAccountAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/bank-accounts`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/bank-accounts/${id}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/bank-accounts`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/bank-accounts/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa tài khoản ngân hàng thất bại');
  },
  uploadQrCode: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}/qr-code`, {
      method: 'POST', headers, body: formData
    });
    if (!response.ok) {
      let message = 'Tải mã QR thất bại';
      try { const errBody = await response.json(); message = errBody.message || message; }
      catch { const text = await response.text(); if (text) message = text; }
      throw new Error(message);
    }
    return response.json();
  },
  getBankNames: async () => requestJson(`${API_BASE_URL}/bank-accounts/bank-names`, { headers: getHeaders() }),
  addBankName: async (data) => requestJson(`${API_BASE_URL}/bank-accounts/bank-names`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  })
};

export const tradeRouteAPI = {
  getAll: async () => requestJson(`${API_BASE_URL}/trade-routes`, { headers: getHeaders() }),
  getActive: async () => requestJson(`${API_BASE_URL}/trade-routes/active`, { headers: getHeaders() }),
  getById: async (id) => requestJson(`${API_BASE_URL}/trade-routes/${id}`, { headers: getHeaders() }),
  create: async (data) => requestJson(`${API_BASE_URL}/trade-routes`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }),
  update: async (id, data) => requestJson(`${API_BASE_URL}/trade-routes/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }),
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/trade-routes/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Xóa tuyến hàng thất bại');
  }
};

export const globalSearchAPI = {
  search: async (keyword) => requestJson(`${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`, { headers: getHeaders() })
};

export const auditLogAPI = {
  getAll: async (username, action, page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (action) params.set('action', action);
    params.set('page', page);
    params.set('size', size);
    return requestJson(`${API_BASE_URL}/audit-logs?${params.toString()}`, { headers: getHeaders() });
  }
};

export const dashboardAPI = {
  getKpi: async () => requestJson(`${API_BASE_URL}/dashboard`, { headers: getHeaders() })
};
