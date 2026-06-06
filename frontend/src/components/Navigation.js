import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/Navigation.css';

function Navigation({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const footerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CEO';

  useEffect(() => {
    const handleClick = (e) => {
      if (footerRef.current && !footerRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  const navSections = [
    {
      label: 'Tổng quan',
      items: [
        { to: '/dashboard', label: 'Bảng điều khiển', short: 'DB' },
        { to: '/notifications', label: 'Thông báo', short: 'TB', badge: unreadCount }
      ]
    },
    {
      label: 'Mua hàng',
      items: [
        { to: '/weekly-plans', label: 'Kế hoạch tuần', short: 'KH' },
        { to: '/purchase-orders', label: 'Đơn hàng', short: 'PO' },
        { to: '/payments', label: 'Đề nghị TT', short: 'TT' }
      ]
    },
     {
       label: 'Kho & Tài chính',
       items: [
         { to: '/warehouse', label: 'Nhận hàng', short: 'WH' },
         { to: '/waybills', label: 'Vận đơn', short: 'VB' },
         { to: '/costs', label: 'Giá vốn SP', short: 'GV' },
         { to: '/cost-alerts', label: 'Cảnh báo giá', short: 'CG' }
       ]
     },
    {
      label: 'Hệ thống',
      items: [
        { to: '/products', label: 'Danh mục SP', short: 'SP' },
        { to: '/admin/exchange-rates', label: 'Tỷ giá', short: 'TG' },
        { to: '/bank-accounts', label: 'TK Ngân hàng', short: 'NH' },
        { to: '/admin/trade-routes', label: 'Tuyến hàng', short: 'TH' },
        ...(isAdmin ? [{ to: '/users', label: 'Tài khoản', short: 'TK' }] : []),
        { to: '/admin', label: 'Cấu hình', short: 'AD' }
      ]
    }
  ];

  const pageName = navSections
    .flatMap((section) => section.items)
    .find((item) => location.pathname.startsWith(item.to))?.label;

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
        <span className="sidebar-toggle-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">SGI Procurement</div>
          <div className="sidebar-subtitle">Quản lý mua hàng</div>
        </div>

      <div className="sidebar-nav">
        {navSections.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <span className="sidebar-link-mark">{item.short}</span>
                <span>{item.label}</span>
                {item.badge > 0 ? (
                  <span className="sidebar-link-badge">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer" ref={footerRef}>
        <button className="sidebar-avatar-btn" onClick={() => setShowUserMenu(v => !v)}>
          {(user?.username || 'U').slice(0, 2).toUpperCase()}
        </button>
        {showUserMenu && (
          <div className="sidebar-user-popup">
            <div className="sidebar-popup-user">
              <div className="sidebar-popup-avatar">
                {(user?.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="sidebar-popup-name">{user?.username || 'User'}</div>
                <div className="sidebar-popup-role">{pageName || user?.role || 'Nhân viên'}</div>
              </div>
            </div>
            <button className="sidebar-popup-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

export default Navigation;
