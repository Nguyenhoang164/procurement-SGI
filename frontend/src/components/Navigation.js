import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/Navigation.css';

const ROLE_MENU = {
  ADMIN: ['dashboard', 'notifications', 'weekly-plans', 'purchase-orders', 'payments', 'warehouse', 'waybills', 'costs', 'cost-alerts', 'products', 'exchange-rates', 'bank-accounts', 'trade-routes', 'users', 'admin'],
  CEO: ['dashboard', 'notifications', 'weekly-plans', 'purchase-orders', 'payments', 'warehouse', 'waybills', 'costs', 'cost-alerts', 'products', 'exchange-rates', 'bank-accounts', 'trade-routes', 'users'],
  WAREHOUSE: ['dashboard', 'notifications', 'waybills', 'warehouse', 'purchase-orders', 'payments', 'weekly-plans', 'products'],
  ACCOUNTANT: ['dashboard', 'notifications', 'payments', 'exchange-rates', 'bank-accounts', 'costs', 'cost-alerts', 'purchase-orders', 'waybills', 'warehouse', 'weekly-plans', 'products', 'trade-routes'],
  CHIEF_ACCOUNTANT: ['dashboard', 'notifications', 'payments', 'exchange-rates', 'bank-accounts', 'costs', 'cost-alerts', 'purchase-orders', 'waybills', 'warehouse', 'weekly-plans', 'products', 'trade-routes'],
  SALES: ['dashboard', 'notifications', 'weekly-plans', 'purchase-orders', 'products', 'trade-routes', 'payments', 'waybills', 'warehouse', 'bank-accounts'],
  SALES_MANAGER: ['dashboard', 'notifications', 'weekly-plans', 'purchase-orders', 'products', 'trade-routes', 'payments', 'waybills', 'warehouse', 'bank-accounts', 'costs', 'cost-alerts'],
  PURCHASING: ['dashboard', 'notifications', 'weekly-plans', 'purchase-orders', 'payments', 'waybills', 'warehouse', 'products', 'trade-routes', 'bank-accounts']
};

function Navigation({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const footerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const role = user?.role || 'PENDING';
  const allowed = ROLE_MENU[role] || [];

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
      key: 'overview',
      items: [
        { to: '/dashboard', label: 'Bảng điều khiển', key: 'dashboard', short: 'DB' },
        { to: '/notifications', label: 'Thông báo', key: 'notifications', short: 'TB', badge: unreadCount }
      ]
    },
    {
      label: 'Mua hàng',
      key: 'purchasing',
      items: [
        { to: '/weekly-plans', label: 'Kế hoạch tuần', key: 'weekly-plans', short: 'KH' },
        { to: '/purchase-orders', label: 'Đơn hàng', key: 'purchase-orders', short: 'PO' },
        { to: '/payments', label: 'Đề nghị TT', key: 'payments', short: 'TT' }
      ]
    },
    {
      label: 'Kho & Tài chính',
      key: 'warehouse',
      items: [
        { to: '/warehouse', label: 'Nhận hàng', key: 'warehouse', short: 'WH' },
        { to: '/waybills', label: 'Vận đơn', key: 'waybills', short: 'VB' },
        { to: '/costs', label: 'Giá vốn SP', key: 'costs', short: 'GV' },
        { to: '/cost-alerts', label: 'Cảnh báo giá', key: 'cost-alerts', short: 'CG' }
      ]
    },
    {
      label: 'Danh mục',
      key: 'catalog',
      items: [
        { to: '/products', label: 'Sản phẩm', key: 'products', short: 'SP' },
        { to: '/admin/exchange-rates', label: 'Tỷ giá', key: 'exchange-rates', short: 'TG' },
        { to: '/bank-accounts', label: 'TK Ngân hàng', key: 'bank-accounts', short: 'NH' },
        { to: '/admin/trade-routes', label: 'Tuyến hàng', key: 'trade-routes', short: 'TH' }
      ]
    },
    {
      label: 'Hệ thống',
      key: 'system',
      items: [
        { to: '/users', label: 'Tài khoản', key: 'users', short: 'TK' },
        { to: '/admin', label: 'Cấu hình', key: 'admin', short: 'AD' }
      ]
    }
  ];

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => allowed.includes(item.key))
    }))
    .filter(section => section.items.length > 0);

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
        {filteredSections.map((section) => (
          <div className="sidebar-section" key={section.key}>
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
