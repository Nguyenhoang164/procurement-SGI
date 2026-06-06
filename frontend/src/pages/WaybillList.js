import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { waybillAPI } from '../services/api';

function WaybillList() {
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Vận đơn (Waybill)</h1>
          <p className="page-subtitle">Theo dõi vận chuyển và đối chiếu nhập kho</p>
        </div>
      <div className="page-actions">
        <button className="btn btn-primary" onClick={() => navigate('/waybills/new')}>Tạo vận đơn mới</button>
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
                    <th>Trạng thái</th>
                    <th>SL dự kiến</th>
                    <th>SL thực tế</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((wb) => (
                    <tr key={wb.id}>
                      <td><a href={`/waybills/${wb.id}`} className="link">{wb.waybillCode}</a></td>
                      <td>{wb.carrier || '-'}</td>
                      <td>{wb.paymentRequestId ? <a href={`/payments/${wb.paymentRequestId}`} className="link">DNTT-{wb.paymentRequestId}</a> : '-'}</td>
                      <td><span className={`badge badge-${(wb.status || '').toLowerCase()}`}>{wb.status || '-'}</span></td>
                      <td>{wb.expectedQty != null ? wb.expectedQty : '-'}</td>
                      <td>{wb.actualQty != null ? wb.actualQty : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-view" onClick={() => navigate(`/waybills/${wb.id}`)}>Xem</button>
                          <button className="btn btn-sm btn-view" onClick={() => navigate(`/waybills/edit/${wb.id}`)}>Sửa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
