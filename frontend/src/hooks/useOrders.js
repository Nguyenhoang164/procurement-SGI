import { useState } from 'react';
import { purchaseOrderAPI } from '../services/api';

export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const created = await purchaseOrderAPI.create(data);
      setLoading(false);
      return created;
    } catch (err) {
      setError(err.message || 'Tạo đơn hàng thất bại');
      setLoading(false);
      throw err;
    }
  };

  return { createOrder, loading, error };
}

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrderAPI.getAll();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || 'Tải danh sách đơn hàng thất bại');
      setLoading(false);
      throw err;
    }
  };

  return { fetchAll, loading, error };
}
