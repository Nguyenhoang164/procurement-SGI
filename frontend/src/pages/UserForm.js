import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { userAPI } from '../services/userApi';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CEO', label: 'CEO' },
  { value: 'WAREHOUSE', label: 'Thủ kho' },
  { value: 'ACCOUNTANT', label: 'Kế toán' },
  { value: 'CHIEF_ACCOUNTANT', label: 'Kế toán trưởng' },
  { value: 'SALES', label: 'Nhân viên kinh doanh' },
  { value: 'SALES_MANAGER', label: 'Trưởng phòng kinh doanh' },
  { value: 'PURCHASING', label: 'Nhân viên mua hàng' }
];

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'PENDING',
    market: '',
    active: true
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    userAPI.getById(id)
      .then(data => {
        setFormData({
          username: data.username || '',
          password: '',
          role: data.role || 'USER',
          market: data.market || '',
          active: data.active
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) { setError('Vui lòng nhập tên đăng nhập.'); return; }
    if (!isEdit && !formData.password) { setError('Vui lòng nhập mật khẩu.'); return; }
    if (formData.password && formData.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    if (!formData.role) { setError('Vui lòng chọn vai trò.'); return; }

    const payload = { ...formData };
    if (isEdit && !payload.password) {
      delete payload.password;
    }

    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await userAPI.update(id, payload);
      } else {
        await userAPI.create(payload);
      }
      navigate('/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="page-screen"><p>Đang tải...</p></div>;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h1>
          <p className="page-subtitle">{isEdit ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản cho người dùng mới'}</p>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message" style={{ marginBottom: 16 }}>{error}</div> : null}

        <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: 500 }}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              className="form-input"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              disabled={isEdit}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Mật khẩu {isEdit ? '(để trống nếu không đổi)' : ''}
            </label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
              minLength={isEdit ? 0 : 6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vai trò</label>
            <select className="form-input" name="role" value={formData.role} onChange={handleChange} required>
              <option value="">-- Chọn vai trò --</option>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Thị trường</label>
            <input
              className="form-input"
              name="market"
              value={formData.market}
              onChange={handleChange}
              placeholder="Ví dụ: Vietnam, China, All Markets"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              id="active-check"
            />
            <label className="form-label" htmlFor="active-check" style={{ marginBottom: 0 }}>Kích hoạt</label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo tài khoản')}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/users')}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserForm;
