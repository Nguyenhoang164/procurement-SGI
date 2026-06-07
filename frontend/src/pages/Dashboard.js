import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

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

  const { statCards, recentOrders, weeklyTrend, planTrend, paymentTrend, sourceBreakdown, topProducts } = data;

  const trendData = (weeklyTrend || []).map(t => ({
    name: t.week,
    'Đơn hàng': t.count
  }));
  const planData = (planTrend || []).map(t => ({
    name: t.week,
    'KH tuần': t.count
  }));
  const paymentData = (paymentTrend || []).map(t => ({
    name: t.week,
    'DNTT': t.count
  }));

  const topProductData = (topProducts || []).map(p => ({
    name: (p.productName || p.posCode || '').length > 25
      ? (p.productName || p.posCode || '').substring(0, 22) + '...'
      : (p.productName || p.posCode || ''),
    'SL': p.totalQty
  })).reverse();

  const pieData = (sourceBreakdown || []).map(s => ({
    name: s.label,
    value: s.count
  }));

  const hasCharts = trendData.length > 0 || pieData.length > 0;
  const hasRecentOrders = recentOrders && recentOrders.length > 0;

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

        {hasCharts && (
          <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {trendData.length > 0 && (
              <div className="chart-card">
                <div className="surface-title">Đơn hàng theo tháng</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Line type="monotone" dataKey="Đơn hàng" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {planData.length > 0 && (
              <div className="chart-card">
                <div className="surface-title">KH tuần theo tháng</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={planData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Line type="monotone" dataKey="KH tuần" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {paymentData.length > 0 && (
              <div className="chart-card">
                <div className="surface-title">DNTT theo tháng</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={paymentData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Line type="monotone" dataKey="DNTT" stroke="#d97706" strokeWidth={2} dot={{ r: 3, fill: '#d97706' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {pieData.length > 0 && (
              <div className="chart-card">
                <div className="surface-title">Phân bổ theo nguồn nhập</div>
                <div style={{ display: 'flex', alignItems: 'center', height: 180 }}>
                  <ResponsiveContainer width="55%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                    {pieData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {topProductData.length > 0 && (
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="surface-title">Top sản phẩm đặt nhiều nhất</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProductData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="SL" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasRecentOrders && (
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
