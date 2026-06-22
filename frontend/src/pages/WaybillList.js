import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { waybillAPI } from '../services/api';
import { canCrudWaybill, getUser } from '../utils/permissions';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ vận chuyển' },
  { value: 'IN_TRANSIT', label: 'Đang vận chuyển' },
  { value: 'WAITING_DELIVERY', label: 'Chờ giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]));

function WaybillList() {
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const userData = getUser();
  const canCrud = canCrudWaybill(userData);

  const fetchWaybills = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (searchTerm.trim() !== '') {
        data = await waybillAPI.search(searchTerm);
      } else {
        data = await waybillAPI.getAll();
      }
      setWaybills(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleSearch = useCallback(() => {
    fetchWaybills();
  }, [fetchWaybills]);

  useEffect(() => { fetchWaybills(); }, [fetchWaybills]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await waybillAPI.updateStatus(id, newStatus);
      setWaybills(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Vận đơn (Waybill)</h1>
          <p className="page-subtitle">Theo dõi vận chuyển và đối chiếu nhập kho</p>
        </div>
      <div className="page-actions">
        {canCrud && (
          <button className="btn btn-primary" onClick={() => navigate('/waybills/new')}>Tạo vận đơn mới</button>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Tìm kiếm bằng mã vận đơn hoặc mã sản phẩm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: 250 }}
          />
          <button 
            className="btn btn-secondary" 
            onClick={handleSearch}
            style={{ padding: '8px 16px' }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : waybills.length === 0 ? (
          <div className="empty-state">Chưa có vận đơn nào.</div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã vận đơn</th>
                    <th>Đơn vị VC</th>
                    <th>DNTT</th>
                    <th>H.thức VC</th>
                    <th>Sản phẩm</th>
                    <th>Trạng thái</th>
                    <th>Số kiện</th>
                    <th>SL thực nhận</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((wb) => {
                    let productList = [];
                    try {
                      if (wb.products) productList = JSON.parse(wb.products);
                    } catch (e) { /* ignore */ }
                    const prIds = wb.paymentRequestIds && wb.paymentRequestIds.length > 0 ? wb.paymentRequestIds : (wb.paymentRequestId ? [wb.paymentRequestId] : []);
                    return (
                    <tr key={wb.id}>
                      <td><a href={`/waybills/${wb.id}`} className="link">{wb.waybillCode}</a></td>
                      <td>{wb.carrier || '-'}</td>
                      <td>
                        {prIds.length > 0
                          ? prIds.map((pid, i) => (
                              <span key={pid}>
                                {i > 0 && <span style={{ margin: '0 2px' }}>, </span>}
                                <a href={`/payments/${pid}`} className="link">DNTT-{pid}</a>
                              </span>
                            ))
                          : '-'}
                      </td>
                      <td>{wb.shippingMethod || '-'}</td>
                      <td style={{ maxWidth: 250 }}>
                        {productList.length > 0
                          ? productList.map((p, i) => (
                              <span key={i} style={{ display: 'inline-block', background: '#eef2ff', borderRadius: 4, padding: '1px 6px', margin: '1px 2px', fontSize: 12, whiteSpace: 'nowrap' }}>
                                {p.productShortCode || p.productName || p.posCode || '-'}
                              </span>
                            ))
                          : '-'}
                      </td>
                      <td>
                        {updatingId === wb.id ? (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Đang cập nhật...</span>
                        ) : (
                          <select
                            value={wb.status || ''}
                            onChange={e => handleStatusChange(wb.id, e.target.value)}
                            style={{
                              padding: '4px 6px', borderRadius: 4, border: '1px solid #d1d5db',
                              fontSize: 13, background: '#fff', cursor: 'pointer', minWidth: 130
                            }}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{wb.expectedQty != null ? wb.expectedQty : '-'}</td>
                      <td>{wb.actualQty != null ? wb.actualQty : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-view" onClick={() => navigate(`/waybills/${wb.id}`)}>Xem</button>
                          {canCrud && (
                            <button className="btn btn-sm btn-view" onClick={() => navigate(`/waybills/edit/${wb.id}`)}>Sửa</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaybillList;
