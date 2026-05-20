import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand">
          SGI Procurement
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/weekly-plans" className="nav-link">
              Kế hoạch tuần
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/purchase-orders" className="nav-link">
              Đơn hàng
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/payments" className="nav-link">
              Đề nghị TT
            </Link>
          </li>
        </ul>
        <div className="nav-user">
          <span className="user-info">{user?.username} ({user?.role})</span>
          <button className="btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
