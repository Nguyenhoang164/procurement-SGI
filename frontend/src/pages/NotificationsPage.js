import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatNotificationTime, useNotifications } from '../hooks/useNotifications';
import '../styles/Notifications.css';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'weekly_plan', label: 'Kế hoạch tuần' },
  { key: 'purchase_order', label: 'Đơn hàng' },
  { key: 'payment_request', label: 'Đề nghị TT' }
];

function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    typeMeta
  } = useNotifications({ autoRefreshMs: 0 });

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((item) => item.entityType === filter);
  }, [filter, notifications]);

  const counts = useMemo(() => {
    const base = { all: notifications.length, unread: unreadCount };
    FILTERS.slice(1).forEach(({ key }) => {
      base[key] = notifications.filter((item) => item.entityType === key).length;
    });
    return base;
  }, [notifications, unreadCount]);

  const handleOpen = (item) => {
    if (!item.read) {
      markRead(item.id);
    }
    navigate(item.link);
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Thông báo</h1>
          <p className="page-subtitle">
            Các việc chờ phê duyệt từ kế hoạch tuần, đơn hàng và đề nghị thanh toán
          </p>
        </div>
        <div className="page-actions">
          {unreadCount > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={markAllRead}>
              Đánh dấu đã đọc
            </button>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}>
            Làm mới
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="notify-summary-grid">
          <div className="notify-summary-card">
            <div className="notify-summary-label">Chưa đọc</div>
            <div className="notify-summary-value" style={{ color: '#dc2626' }}>
              {unreadCount}
            </div>
          </div>
          <div className="notify-summary-card">
            <div className="notify-summary-label">Tổng việc chờ</div>
            <div className="notify-summary-value" style={{ color: '#2563eb' }}>
              {counts.all}
            </div>
          </div>
          <div className="notify-summary-card">
            <div className="notify-summary-label">DNTT chờ duyệt</div>
            <div className="notify-summary-value" style={{ color: '#d97706' }}>
              {counts.payment_request || 0}
            </div>
          </div>
        </div>

        <div className="notify-filter-bar">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`notify-filter-btn${filter === item.key ? ' active' : ''}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
              <span className="notify-filter-count">{counts[item.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải thông báo...</div>
        ) : filtered.length === 0 ? (
          <div className="notify-page-empty">
            <div className="notify-page-empty-icon" aria-hidden="true">✓</div>
            <h2>Không có thông báo trong nhóm này</h2>
            <p>Tất cả hạng mục đã được xử lý hoặc chưa có dữ liệu chờ duyệt.</p>
          </div>
        ) : (
          <div className="notify-list-card">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`notify-list-item${item.read ? ' read' : ''}${item.priority === 'high' ? ' urgent' : ''}`}
                onClick={() => handleOpen(item)}
              >
                <div className="notify-list-main">
                  <div className="notify-list-top">
                    <span className={`notify-type notify-type-${item.entityType}`}>
                      {typeMeta[item.entityType]?.label}
                    </span>
                    <span className={`notify-status-pill status-${item.status?.toLowerCase()}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <div className="notify-list-title">{item.title}</div>
                  <div className="notify-list-msg">{item.message}</div>
                </div>
                <div className="notify-list-side">
                  <span className="notify-list-time">
                    {formatNotificationTime(item.createdAt)}
                  </span>
                  {!item.read ? <span className="notify-list-new">Mới</span> : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
