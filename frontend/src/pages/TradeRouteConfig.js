import React, { useEffect, useState } from 'react';
import '../styles/Form.css';
import { tradeRouteAPI } from '../services/api';

function TradeRouteConfig() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ routeName: '', origin: '', destination: '', description: '', active: true });
  const [newForm, setNewForm] = useState({ routeName: '', origin: '', destination: '', description: '' });

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await tradeRouteAPI.getAll();
      setRoutes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleAdd = async () => {
    if (!newForm.routeName) { setError('Vui lòng nhập tên tuyến hàng.'); return; }
    try {
      await tradeRouteAPI.create(newForm);
      setNewForm({ routeName: '', origin: '', destination: '', description: '' });
      fetchRoutes();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await tradeRouteAPI.update(id, editForm);
      setEditId(null);
      fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tuyến hàng này?')) return;
    try {
      await tradeRouteAPI.delete(id);
      fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (route) => {
    setEditId(route.id);
    setEditForm({ ...route });
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Cấu hình tuyến hàng</h1>
          <p className="page-subtitle">Quản lý danh sách tuyến mua hàng (VD: Trung - Philipin)</p>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <label>Tên tuyến</label>
            <input value={newForm.routeName} onChange={e => setNewForm(f => ({ ...f, routeName: e.target.value }))}
              placeholder="Trung - Philipin" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 120 }}>
            <label>Xuất phát</label>
            <input value={newForm.origin} onChange={e => setNewForm(f => ({ ...f, origin: e.target.value }))}
              placeholder="Trung Quốc" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 120 }}>
            <label>Điểm đến</label>
            <input value={newForm.destination} onChange={e => setNewForm(f => ({ ...f, destination: e.target.value }))}
              placeholder="Philippines" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <label>Mô tả</label>
            <input value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả tuyến hàng" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!newForm.routeName}
            style={{ height: 40, whiteSpace: 'nowrap' }}>Thêm tuyến</button>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Tuyến hàng</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Xuất phát</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Điểm đến</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Mô tả</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Kích hoạt</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id}>
                  {editId === r.id ? (
                    <>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <input value={editForm.routeName} onChange={e => setEditForm(f => ({ ...f, routeName: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <input value={editForm.origin} onChange={e => setEditForm(f => ({ ...f, origin: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <input value={editForm.destination} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleUpdate(r.id)}>Lưu</button>
                        <button className="btn btn-secondary" onClick={() => setEditId(null)}>Hủy</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{r.routeName}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{r.origin || '-'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{r.destination || '-'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{r.description || '-'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <span style={{ color: r.active ? '#059669' : '#dc2626' }}>{r.active ? 'Có' : 'Không'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <button className="btn btn-secondary" style={{ marginRight: 8 }} onClick={() => startEdit(r)}>Sửa</button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(r.id)}>Xóa</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có tuyến hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TradeRouteConfig;
