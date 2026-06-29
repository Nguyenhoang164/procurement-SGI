import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, globalSearchAPI } from '../services/api';
import '../styles/Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

const CHART_PERIOD_SUFFIX = {
  day: '7 ngày gần nhất',
  week: '4 tuần gần nhất',
  month: '6 tháng gần nhất',
  year: '12 tháng gần nhất',
};

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardAPI.getKpi(period, selectedDate)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, selectedDate]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (kw) => {
    if (!kw.trim()) { setSearchResults(null); setShowSearch(false); return; }
    setSearching(true); setShowSearch(true);
    try {
      const res = await globalSearchAPI.search(kw);
      setSearchResults(res);
    } catch { setSearchResults(null); }
    finally { setSearching(false); }
  }, []);

  const handleSearch = (kw) => {
    setSearchKeyword(kw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(kw), 300);
  };

  if (loading && !data) {
    return (
      <div className="page-screen">
        <div className="page-content" style={{ textAlign: 'center', padding: '60px' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-screen">
        <div className="page-content" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#dc2626' }}>Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartSuffix = CHART_PERIOD_SUFFIX[period] || CHART_PERIOD_SUFFIX.month;
  const selectedPeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label?.toLowerCase() || 'tháng';

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
          <p className="page-subtitle">
            Thông tin tổng quan hệ thống
            {loading ? ' · Đang cập nhật...' : ` · Theo ${selectedPeriodLabel}, ngày ${selectedDate.split('-').reverse().join('/')}`}
          </p>
        </div>
        <div className="page-actions dashboard-period-filter">
          <span className="dashboard-filter-label">Xem theo:</span>
          <div className="dashboard-period-group">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`dashboard-period-btn${period === opt.value ? ' active' : ''}`}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="dashboard-filter-label">Ngày:</span>
          <input
            type="date"
            className="dashboard-date-input"
            value={selectedDate}
            max={todayStr()}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => {
              setPeriod('month');
              setSelectedDate(todayStr());
            }}
          >
            Hôm nay
          </button>
        </div>
      </div>

      <div className={`page-content${loading ? ' dashboard-refreshing' : ''}`}>
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
            Lỗi tải dữ liệu: {error}
          </div>
        )}

        <div ref={searchRef} style={{ position: 'relative', marginBottom: 16 }}>
          <input type="text" placeholder="Tìm kiếm nâng cao (PO, sản phẩm, vận đơn, đề nghị TT...)" value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchResults || searching) setShowSearch(true); }}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          {showSearch && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 400, overflow: 'auto', marginTop: 4 }}>
              {searching ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Đang tìm kiếm...</div>
              ) : searchResults ? (
                <>
                  {searchResults.weeklyPlans?.length > 0 && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>KẾ HOẠCH TUẦN ({searchResults.weeklyPlans.length})</div>
                      {searchResults.weeklyPlans.slice(0, 5).map(wp => (
                        <div key={wp.id} style={{ padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#2563eb' }}
                          onClick={() => { navigate(`/weekly-plans/edit/${wp.id}`); setShowSearch(false); setSearchKeyword(''); }}>
                          {wp.posCode || 'KH-' + wp.id}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.purchaseOrders?.length > 0 && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>ĐƠN HÀNG ({searchResults.purchaseOrders.length})</div>
                      {searchResults.purchaseOrders.slice(0, 5).map(po => (
                        <div key={po.id} style={{ padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#2563eb' }}
                          onClick={() => { navigate(`/purchase-orders/${po.id}`); setShowSearch(false); setSearchKeyword(''); }}>
                          {po.poCode} - {po.productName || 'N/A'}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.paymentRequests?.length > 0 && (
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>ĐỀ NGHỊ TT ({searchResults.paymentRequests.length})</div>
                      {searchResults.paymentRequests.slice(0, 5).map(pr => (
                        <div key={pr.id} style={{ padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#2563eb' }}
                          onClick={() => { navigate(`/payments/${pr.id}`); setShowSearch(false); setSearchKeyword(''); }}>
                          DNTT-{String(pr.id).padStart(4, '0')}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.waybills?.length > 0 && (
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>VẬN ĐƠN ({searchResults.waybills.length})</div>
                      {searchResults.waybills.slice(0, 5).map(wb => (
                        <div key={wb.id} style={{ padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#2563eb' }}
                          onClick={() => { navigate(`/waybills/${wb.id}`); setShowSearch(false); setSearchKeyword(''); }}>
                          {wb.waybillCode || 'WB-' + wb.id}
                        </div>
                      ))}
                    </div>
                  )}
                  {(!searchResults.weeklyPlans?.length && !searchResults.purchaseOrders?.length && !searchResults.paymentRequests?.length && !searchResults.waybills?.length) && (
                    <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy kết quả phù hợp.</div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

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
                <div className="surface-title">Đơn hàng ({chartSuffix})</div>
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
                <div className="surface-title">KH tuần ({chartSuffix})</div>
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
                <div className="surface-title">DNTT ({chartSuffix})</div>
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
              <a href="/purchase-orders" onClick={(e) => { e.preventDefault(); window.location.href = '/purchase-orders'; }}
                style={{ color: '#2563eb', fontSize: 13, textDecoration: 'none' }}>Xem tất cả →</a>
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
