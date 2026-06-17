import React, { useEffect, useState } from 'react';
import { auditLogAPI } from '../services/api';
import '../styles/List.css';

const ACTION_LABELS = {
  LOGIN: 'Đăng nhập',
  REGISTER: 'Đăng ký',
  CREATE_USER: 'Thêm người dùng',
  UPDATE_USER: 'Sửa người dùng',
  DELETE_USER: 'Xóa người dùng',
  DEACTIVATE_USER: 'Vô hiệu hóa'
};

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))
];

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [size] = useState(20);
  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const data = await auditLogAPI.getAll(
        filterUsername || undefined,
        filterAction || undefined,
        p, size
      );
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(data.page || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(0); }, []);

  const handleSearch = () => fetchLogs(0);

  const handleRefresh = () => {
    setFilterUsername('');
    setFilterAction('');
    fetchLogs(0);
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Nhật ký hoạt động</h1>
          <p className="page-subtitle">Lịch sử truy vết hành động của người dùng trong hệ thống</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>Làm mới</button>
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Lọc theo tài khoản..." value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff' }}>
            {ACTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>Tìm</button>
          <button className="btn btn-secondary" onClick={handleRefresh}>Xóa lọc</button>
        </div>

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">Chưa có nhật ký nào.</div>
        ) : (
          <>
            <div className="table-card">
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ tableLayout: 'auto', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>#</th>
                      <th>Tài khoản</th>
                      <th style={{ width: 110 }}>Hành động</th>
                      <th style={{ width: 110 }}>Đối tượng</th>
                      <th>Chi tiết</th>
                      <th style={{ width: 80 }}>IP</th>
                      <th style={{ width: 160 }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log.id}>
                        <td>{page * size + idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{log.username}</div>
                          {log.userRole && (
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.userRole}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${log.action?.toLowerCase() || 'draft'}`}
                            style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {log.entityType ? `${log.entityType}#${log.entityId}` : '-'}
                        </td>
                        <td style={{ fontSize: 13, wordBreak: 'break-word' }}>{log.details || '-'}</td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{log.ipAddress || '-'}</td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#64748b' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 12, fontSize: 13, color: '#64748b'
              }}>
                <span>Tổng: {total} bản ghi</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-secondary" disabled={page === 0}
                    onClick={() => fetchLogs(page - 1)}>Trước</button>
                  <span style={{ padding: '4px 8px' }}>Trang {page + 1}/{totalPages}</span>
                  <button className="btn btn-sm btn-secondary" disabled={page >= totalPages - 1}
                    onClick={() => fetchLogs(page + 1)}>Sau</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;
