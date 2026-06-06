import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardAPI.getKpi()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-screen">
        <div className="page-content" style={{ textAlign: 'center', padding: '60px' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-screen">
        <div className="page-content" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#dc2626' }}>Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { statCards, recentOrders, weeklyTrend, sourceBreakdown } = data;

  const maxBarValue = weeklyTrend && weeklyTrend.length > 0
    ? Math.max(...weeklyTrend.map(t => t.count || 1), 1)
    : 1;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Bảng điều khiển tổng quan</h1>
          <p className="page-subtitle">Thông tin tổng quan hệ thống</p>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          {statCards.map((card, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="stat-sub">{card.subtitle}</div>
            </div>
          ))}
        </div>

        {weeklyTrend && weeklyTrend.length > 0 && sourceBreakdown && sourceBreakdown.length > 0 && (
          <div className="chart-grid">
            <div className="chart-card">
              <div className="surface-title">Xu hướng 8 tuần</div>
              <div className="mini-bars">
                {weeklyTrend.map((item, index) => (
                  <div
                    key={index}
                    className="mini-bar"
                    style={{ height: `${(item.count / maxBarValue) * 72}px` }}
                    title={`Tuần ${item.week}: ${item.count} đơn`}
                  />
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="surface-title">Theo nguồn nhập</div>
              <div className="source-list">
                {sourceBreakdown.map((item) => (
                  <div className="source-row" key={item.label}>
                    <div className="source-meta">
                      <span>{item.label}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="source-track">
                      <div
                        className="source-fill"
                        style={{ width: `${item.percentage}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {recentOrders && recentOrders.length > 0 && (
          <div className="table-card">
            <div className="table-toolbar">
              <h2>Đơn hàng gần đây</h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Mã đơn</th>
                    <th>Tên sản phẩm</th>
                    <th style={{ width: 100 }}>Mã POS</th>
                    <th style={{ width: 90 }}>SL</th>
                    <th style={{ width: 140 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.poCode}</td>
                      <td>{order.productName}</td>
                      <td>{order.posCode}</td>
                      <td>{order.orderedQty != null ? order.orderedQty.toLocaleString() : 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${getStatusClass(order.status)}`}>
                          {order.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'DRAFT': return 'draft';
    case 'PENDING_L1': return 'pending';
    case 'APPROVED': return 'approved';
    case 'SENT_TO_ACCOUNTING': return 'accounting';
    case 'REJECTED': return 'rejected';
    case 'IN_TRANSIT': return 'in_transit';
    case 'PAID': return 'completed';
    case 'DELIVERED': return 'completed';
    default: return '';
  }
}

export default Dashboard;
