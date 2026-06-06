import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatNotificationTime, useNotifications } from '../hooks/useNotifications';
import '../styles/Notifications.css';

function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    typeMeta
  } = useNotifications();

  const preview = notifications.slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpenItem = (item) => {
    if (!item.read) {
      markRead(item.id);
    }
    setOpen(false);
    navigate(item.link);
  };

  return (
    <div className="notify-bell-wrap" ref={panelRef}>
      <button
        type="button"
        className={`notify-bell-btn${open ? ' active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <span className="notify-bell-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        {unreadCount > 0 ? (
          <span className="notify-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notify-dropdown">
          <div className="notify-dropdown-head">
            <div>
              <div className="notify-dropdown-title">Thông báo</div>
              <div className="notify-dropdown-sub">
                {unreadCount > 0
                  ? `${unreadCount} việc cần xử lý`
                  : 'Không có việc mới'}
              </div>
            </div>
            {unreadCount > 0 ? (
              <button type="button" className="notify-text-btn" onClick={markAllRead}>
                Đọc tất cả
              </button>
            ) : null}
          </div>

          <div className="notify-dropdown-body">
            {loading ? (
              <div className="notify-empty">Đang tải...</div>
            ) : preview.length === 0 ? (
              <div className="notify-empty">
                <div className="notify-empty-title">Đã xử lý hết</div>
                <div className="notify-empty-sub">Không có kế hoạch, PO hay DNTT đang chờ duyệt.</div>
              </div>
            ) : (
              preview.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notify-item${item.read ? ' read' : ''}${item.priority === 'high' ? ' urgent' : ''}`}
                  onClick={() => handleOpenItem(item)}
                >
                  <div className="notify-item-top">
                    <span className={`notify-type notify-type-${item.entityType}`}>
                      {typeMeta[item.entityType]?.prefix}
                    </span>
                    <span className="notify-item-time">
                      {formatNotificationTime(item.createdAt)}
                    </span>
                  </div>
                  <div className="notify-item-title">{item.title}</div>
                  <div className="notify-item-msg">{item.message}</div>
                  {!item.read ? <span className="notify-unread-dot" /> : null}
                </button>
              ))
            )}
          </div>

          <div className="notify-dropdown-foot">
            <Link to="/notifications" className="notify-view-all" onClick={() => setOpen(false)}>
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
