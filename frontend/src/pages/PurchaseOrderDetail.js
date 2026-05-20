import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { purchaseOrderAPI } from '../services/api';

function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await purchaseOrderAPI.getById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!order) return <div className="error-message">Không tìm thấy đơn hàng</div>;

  return (
    <div className="detail-container">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>
          ← Quay lại
        </button>
        <h1>Chi tiết đơn hàng - {order.posCode}</h1>
        <button className="btn btn-primary" onClick={() => navigate(`/purchase-orders/edit/${id}`)}>
          Chỉnh sửa
        </button>
      </div>

      <div className="detail-grid">
        <section className="detail-section">
          <h3>Thông tin chung</h3>
          <div className="info-row">
            <span className="label">Mã POS:</span>
            <span className="value">{order.posCode}</span>
          </div>
          <div className="info-row">
            <span className="label">SL đặt:</span>
            <span className="value">{order.orderedQty} pcs</span>
          </div>
          <div className="info-row">
            <span className="label">Giá đơn vị:</span>
            <span className="value">${order.unitPrice?.toFixed(2)} {order.currency}</span>
          </div>
          <div className="info-row">
            <span className="label">Tỉ giá:</span>
            <span className="value">{order.exchangeRate?.toFixed(4)}</span>
          </div>
        </section>

        <section className="detail-section">
          <h3>Chi phí vận chuyển</h3>
          <div className="info-row">
            <span className="label">VC quốc tế:</span>
            <span className="value">{order.intlShippingVnd?.toLocaleString()} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">VC nội địa:</span>
            <span className="value">{order.domesticShippingVnd?.toLocaleString()} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">Phí đặt hàng:</span>
            <span className="value">{order.orderFeeVnd?.toLocaleString()} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">Phí giao hàng:</span>
            <span className="value">{order.localDeliveryFeeVnd?.toLocaleString()} ₫</span>
          </div>
        </section>

        <section className="detail-section highlight">
          <h3>Tổng hợp</h3>
          <div className="info-row">
            <span className="label">Tổng tiền lô:</span>
            <span className="value money">{order.totalLotCostVnd?.toLocaleString()} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">GV 1 SP:</span>
            <span className="value money">{order.unitCostFullVnd?.toFixed(0)} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">Deposit:</span>
            <span className="value">{order.depositVnd?.toLocaleString()} ₫</span>
          </div>
          <div className="info-row">
            <span className="label">Còn phải TT:</span>
            <span className="value money">{order.remainingPaymentVnd?.toLocaleString()} ₫</span>
          </div>
        </section>

        <section className="detail-section">
          <h3>Trạng thái</h3>
          <div className="info-row">
            <span className="label">Tình trạng:</span>
            <span className={`badge badge-${order.status?.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Tạo bởi:</span>
            <span className="value">{order.createdBy || '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Tạo lúc:</span>
            <span className="value">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PurchaseOrderDetail;
