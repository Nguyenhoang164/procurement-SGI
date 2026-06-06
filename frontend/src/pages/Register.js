import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', market: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) { setError('Vui lòng nhập tên đăng nhập.'); return; }
    if (formData.username.trim().length < 3) { setError('Tên đăng nhập phải có ít nhất 3 ký tự.'); return; }
    if (!formData.password) { setError('Vui lòng nhập mật khẩu.'); return; }
    if (formData.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }

    setLoading(true);
    try {
      await authAPI.register(formData.username.trim(), formData.password, formData.market.trim());
      setSuccess(true);
    } catch (err) {
      const msg = err.message || 'Đăng ký thất bại';
      if (msg.includes('already exists')) {
        setError('Tên đăng nhập đã tồn tại.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, marginTop: 20 }}>✅</div>
          <h2 style={{ color: '#065f46', marginBottom: 12 }}>Đăng ký thành công!</h2>
          <p>
            Tài khoản <strong>{formData.username}</strong> đã được tạo.
          </p>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
            Tài khoản của bạn đang chờ Admin phân quyền.
          </p>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Vui lòng đợi thông báo hoặc liên hệ Admin để được kích hoạt.
          </p>
          <button className="btn-login" style={{ marginTop: 24 }} onClick={() => navigate('/login')}>
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">SGI Procurement</h1>
        <p className="login-subtitle">Đăng ký tài khoản mới</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Thị trường (không bắt buộc)</label>
            <input
              type="text"
              name="market"
              value={formData.market}
              onChange={handleChange}
              placeholder="Ví dụ: Vietnam, China"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="login-hint">
          Đã có tài khoản? <Link to="/login" style={{ color: '#667eea', fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
