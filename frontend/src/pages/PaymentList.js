import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { paymentRequestAPI } from '../services/api';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentRequestAPI.getAll();
      setPayments(data);
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
        await paymentRequestAPI.delete(id);
        setPayments(payments.filter(p => p.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Đề nghị thanh toán (DNTT)</h1>
        <button className="btn btn-primary" onClick={() => navigate('/payments/new')}>
          + Lập DNTT mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">Chưa có DNTT nào</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>PO ID</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>PO-{payment.poId}</td>
                  <td>{payment.type}</td>
                  <td className="money">{payment.amountVnd?.toLocaleString()} ₫</td>
                  <td>
                    <span className={`badge badge-${payment.status?.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-view" onClick={() => navigate(`/payments/${payment.id}`)}>
                      Xem
                    </button>
                    <button className="btn btn-sm btn-delete" onClick={() => handleDelete(payment.id)}>
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

export default PaymentList;
