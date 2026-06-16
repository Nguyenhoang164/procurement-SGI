import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { productCostAPI } from '../services/api';

function CostAlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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

  const formatVnd = (value) => {
    if (!value) return '—';
    return Number(value).toLocaleString('vi-VN') + ' ₫';
  };

  const formatPercent = (value) => {
    if (!value) return '—';
    return Number(value).toFixed(2) + '%';
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.posCode && a.posCode.toLowerCase().includes(q)) ||
           (a.productName && a.productName.toLowerCase().includes(q));
  });

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Cảnh báo biến động giá</h1>
          <p className="page-subtitle">Thông báo khi giá vốn sản phẩm thay đổi vượt ngưỡng cho phép</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={loadAlerts}>
            ⟳ Làm mới
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
          <>
            <div className="toolbar">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Tìm theo mã POS hoặc tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="toolbar-count">{filteredAlerts.length}/{alerts.length} cảnh báo</span>
            </div>

            <div className="table-card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã POS</th>
                      <th>Tên sản phẩm</th>
                      <th className="money">Giá vốn kỳ trước</th>
                      <th className="money">Giá vốn hiện tại</th>
                      <th className="money">Chênh lệch (VND)</th>
                      <th className="money">Chênh lệch (%)</th>
                      <th>Mức độ</th>
                      <th>Thời gian</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => {
                      const isUp = alert.alertType === 'HIGH_VARIANCE';
                      const cls = isUp ? 'cost-alert-up' : 'cost-alert-down';
                      const absPct = alert.variancePercentage
                        ? Math.abs(Number(alert.variancePercentage))
                        : 0;
                      const severity =
                        absPct >= 200 ? 'Nghiêm trọng' :
                        absPct >= 100 ? 'Cao' :
                        absPct >= 50  ? 'Trung bình' : 'Thấp';
                      const severityClass =
                        absPct >= 200 ? 'severity-critical' :
                        absPct >= 100 ? 'severity-high' :
                        absPct >= 50  ? 'severity-medium' : 'severity-low';
                      const barWidth = Math.min(absPct, 100);

                      return (
                        <tr key={alert.id}>
                          <td className="poscode-cell">{alert.posCode}</td>
                          <td className="name-cell">{alert.productName}</td>
                          <td className="money">{formatVnd(alert.expectedCostVnd)}</td>
                          <td className="money">{formatVnd(alert.actualCostVnd)}</td>
                          <td className={`money ${cls}`}>
                            <span className={isUp ? 'trend-up' : 'trend-down'}>
                              {isUp ? '▲' : '▼'}
                            </span>
                            {' '}{formatVnd(alert.varianceAmountVnd)}
                          </td>
                          <td className={`money ${cls}`}>
                            <div className="pct-bar-wrapper">
                              <div className="pct-bar-track">
                                <div
                                  className={`pct-bar-fill ${cls}`}
                                  style={{ width: barWidth + '%' }}
                                />
                              </div>
                              <span className="pct-value">
                                {isUp ? '+' : ''}{formatPercent(alert.variancePercentage)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${severityClass}`}>
                              {severity}
                            </span>
                          </td>
                          <td className="time-cell">
                            {alert.createdAt
                              ? new Date(alert.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })
                              : '—'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-view"
                              onClick={() => handleViewProduct(alert.posCode)}>
                              Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CostAlertsList;