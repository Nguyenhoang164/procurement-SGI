import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { userAPI } from '../services/userApi';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  CEO: 'CEO',
  WAREHOUSE: 'Thủ kho',
  ACCOUNTANT: 'Kế toán',
  CHIEF_ACCOUNTANT: 'Kế toán trưởng',
  SALES: 'Lead kinh doanh',
  SALES_MANAGER: 'Trưởng phòng kinh doanh',
  PURCHASING: 'Nhân viên mua hàng'
};

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    userAPI.getById(id)
      .then(data => setUser(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-screen"><p>Đang tải...</p></div>;
  if (error) return <div className="page-screen"><div className="error-message">{error}</div></div>;
  if (!user) return <div className="page-screen"><p>Không tìm thấy tài khoản.</p></div>;

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 180, fontWeight: 600, color: '#6b7280' }}>{label}</div>
      <div>{value}</div>
    </div>
  );

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Chi tiết tài khoản</h1>
          <p className="page-subtitle">Thông tin người dùng: {user.username}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/users')} style={{ marginRight: 8 }}>
            Quay lại
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/users/edit/${user.id}`)}>
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 600, border: '1px solid #e5e7eb' }}>
          <Row label="ID" value={`#${user.id}`} />
          <Row label="Tên đăng nhập" value={user.username} />
          <Row label="Vai trò" value={
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              background: '#dbeafe',
              color: '#1e40af'
            }}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
          } />
          <Row label="Phòng kinh doanh" value={user.department || '—'} />
          <Row label="Thị trường" value={user.market || '—'} />
          <Row label="Trạng thái" value={
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              background: user.active ? '#d1fae5' : '#fee2e2',
              color: user.active ? '#065f46' : '#991b1b'
            }}>
              {user.active ? 'Hoạt động' : 'Vô hiệu'}
            </span>
          } />
          <Row label="Ngày tạo" value={user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '—'} />
          <Row label="Cập nhật lần cuối" value={user.updatedAt ? new Date(user.updatedAt).toLocaleString('vi-VN') : '—'} />
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
