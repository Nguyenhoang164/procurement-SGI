import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { warehouseAPI } from '../services/api';
import { canCrudWarehouseReceipt, getUser } from '../utils/permissions';

function WarehouseReceiptList() {
  const user = getUser();
  const canCrud = canCrudWarehouseReceipt(user);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseAPI.getAll();
      setReceipts(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN') : '-';

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Lịch sử nhận hàng</h1>
          <p className="page-subtitle">Danh sách phiếu nhập kho và kiểm đếm</p>
        </div>
        <div className="page-actions">
          {canCrud && (
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/warehouse')}>Nhận hàng mới</button>
          )}
          <button type="button" className="btn btn-secondary" onClick={fetchReceipts}>Làm mới</button>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : receipts.length === 0 ? (
          <div className="empty-state">Chưa có phiếu nhận hàng nào.</div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Vận đơn</th>
                    <th>Mã đơn (PO)</th>
                    <th>SL nhận</th>
                    <th>SL dự kiến</th>
                    <th>Người kiểm</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái</th>
                    <th>Ngày nhận</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id}>
                      <td><strong>#{r.id}</strong></td>
                      <td>
                        {r.waybillId ? (
                          <a onClick={() => navigate(`/waybills/${r.waybillId}`)}
                            style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
                            {r.waybillCode || `WB-${r.waybillId}`}
                          </a>
                        ) : <span className="muted-copy">{r.waybillCode || '—'}</span>}
                      </td>
                      <td>
                        {r.poId > 0 ? (
                          <a onClick={() => navigate(`/purchase-orders/${r.poId}`)}
                            style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
                            {r.poCode || `PO-${r.poId}`}
                          </a>
                        ) : <span className="muted-copy">{r.poCode || '—'}</span>}
                      </td>
                      <td><strong>{r.receivedQty}</strong></td>
                      <td>{r.expectedQty ?? '-'}</td>
                      <td>{r.inspector || '-'}</td>
                      <td>{r.goodsCondition || '-'}</td>
                      <td><span className={`badge badge-${(r.status || '').toLowerCase()}`}>{r.status}</span></td>
                      <td>{formatDate(r.receivedDate)}</td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/warehouse/receipts/${r.id}`)}>Xem</button>
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

export default WarehouseReceiptList;
