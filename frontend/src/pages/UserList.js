import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PURCHASING: 'Nhân viên mua hàng',
  PENDING: 'Chờ phân quyền'
};

const PAGE_SIZE = 10;

function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return true;
    return (u.username && u.username.toLowerCase().includes(kw))
      || (u.role && ROLE_LABELS[u.role]?.toLowerCase().includes(kw))
      || (u.role && u.role.toLowerCase().includes(kw));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${username}"?`)) return;
    try {
      await userAPI.delete(id);
      fetchUsers();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  const handleDeactivate = async (id, username, active) => {
    const action = active ? 'vô hiệu hóa' : 'kích hoạt lại';
    if (!window.confirm(`Xác nhận ${action} tài khoản "${username}"?`)) return;
    try {
      if (active) {
        await userAPI.deactivate(id);
      } else {
        await userAPI.update(id, { active: true });
      }
      fetchUsers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="page-subtitle">Danh sách người dùng tham gia hệ thống</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/users/new')}>
            + Thêm tài khoản
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" placeholder="Tìm kiếm theo tên đăng nhập, vai trò..." value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          <button className="btn btn-secondary" onClick={() => { setSearchKeyword(''); setPage(1); }}>Xóa lọc</button>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>STT</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Tên đăng nhập</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Vai trò</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Phòng kinh doanh</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Thị trường</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Ngày tạo</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u, idx) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/users/${u.id}`)}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{ROLE_LABELS[u.role] || u.role}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{u.department || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{u.market || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.active ? '#d1fae5' : '#fee2e2',
                        color: u.active ? '#065f46' : '#991b1b'
                      }}>
                        {u.active ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                      <button className="btn btn-sm btn-outline" style={{ marginRight: 6 }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/users/edit/${u.id}`); }}>
                        Sửa
                      </button>
                      <button className="btn btn-sm btn-outline"
                        onClick={(e) => { e.stopPropagation(); handleDeactivate(u.id, u.username, u.active); }}>
                        {u.active ? 'Vô hiệu' : 'Kích hoạt'}
                      </button>
                      <button className="btn btn-sm btn-danger" style={{ marginLeft: 6 }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(u.id, u.username); }}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
                <button className="btn btn-sm btn-outline" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${p === safePage ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="btn btn-sm btn-outline" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserList;