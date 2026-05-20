import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { purchaseOrderAPI } from '../services/api';

function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderAPI.getAll();
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa?')) {
      try {
        await purchaseOrderAPI.delete(id);
        setOrders(orders.filter(o => o.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Danh sách đơn hàng</h1>
        <button className="btn btn-primary" onClick={() => navigate('/purchase-orders/new')}>
          + Tạo đơn hàng mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">Chưa có đơn hàng nào</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã POS</th>
                <th>SL</th>
                <th>Giá đơn vị</th>
                <th>Tổng lô</th>
                <th>GV 1 SP</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.posCode}</td>
                  <td>{order.orderedQty}</td>
                  <td>${order.unitPrice?.toFixed(2)}</td>
                  <td className="money">{order.totalLotCostVnd?.toLocaleString()} ₫</td>
                  <td className="money">{order.unitCostFullVnd?.toFixed(0)} ₫</td>
                  <td>
                    <span className={`badge badge-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-view" onClick={() => navigate(`/purchase-orders/${order.id}`)}>
                      Xem
                    </button>
                    <button className="btn btn-sm btn-delete" onClick={() => handleDelete(order.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrderList;
