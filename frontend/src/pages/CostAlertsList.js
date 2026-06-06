import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { productCostAPI } from '../services/api';

function CostAlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productCostAPI.getAllAlerts();
      setAlerts(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleViewProduct = (posCode) => {
    navigate('/products', { state: { search: posCode } });
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Cảnh báo biến động giá</h1>
          <p className="page-subtitle">Thông báo khi giá vốn sản phẩm thay đổi vượt ngưỡng cho phép</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={loadAlerts}>
            Làm mới
          </button>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            Chưa có cảnh báo biến động giá nào.
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã POS</th>
                    <th>Tên sản phẩm</th>
                    <th>Giá vốn kỳ trước</th>
                    <th>Giá vốn kỳ hiện tại</th>
                    <th>Chênh lệch (VND)</th>
                    <th>Chênh lệch (%)</th>
                    <th>Loại cảnh báo</th>
                    <th>Thời gian</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    const varianceType = alert.alertType === 'HIGH_VARIANCE' ? 'Tăng' : 'Giảm';
                    const varianceClass = alert.alertType === 'HIGH_VARIANCE' ? 'cost-alert-up' : 'cost-alert-down';
                    const sign = alert.varianceAmountVnd && alert.varianceAmountVnd.compareTo ? 
                      (alert.varianceAmountVnd.compareTo(0) >= 0 ? '+' : '-') : '';
                    
                    return (
                      <tr key={alert.id}>
                        <td>{alert.posCode}</td>
                        <td>{alert.productName}</td>
                        <td className="money">
                          {alert.expectedCostVnd ? 
                            Number(alert.expectedCostVnd).toLocaleString('vi-VN') + '₫' : '—'}
                        </td>
                        <td className="money">
                          {alert.actualCostVnd ? 
                            Number(alert.actualCostVnd).toLocaleString('vi-VN') + '₫' : '—'}
                        </td>
                        <td className={`money ${varianceClass}`}>
                          {sign}{alert.varianceAmountVnd ? 
                            Number(alert.varianceAmountVnd).toLocaleString('vi-VN') : '0'}₫
                        </td>
                        <td className={`money ${varianceClass}`}>
                          {sign}{alert.variancePercentage ? 
                            Number(alert.variancePercentage).toFixed(2) : '0.00'}%
                        </td>
                        <td>
                          <span className={`badge badge-${alert.alertType.toLowerCase()}`}>
                            {varianceType} ({alert.alertType})
                          </span>
                        </td>
                        <td>
                          {alert.createdAt ? 
                            new Date(alert.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-view" 
                            onClick={() => handleViewProduct(alert.posCode)}>
                            Xem sản phẩm
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostAlertsList;