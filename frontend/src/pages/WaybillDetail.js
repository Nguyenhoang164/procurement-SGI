import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { waybillAPI, paymentRequestAPI } from '../services/api';
import { formatDnttCode } from '../utils/paymentUtils';
import { canCrudWaybill, canConfirmWaybill, getUser } from '../utils/permissions';

const parseVariants = (spec) => {
  if (!spec) return [{ name: '', qty: '' }];
  try {
    const parsed = JSON.parse(spec);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [{ name: spec, qty: '' }];
  } catch {
    return [{ name: spec, qty: '' }];
  }
};

function WaybillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [waybill, setWaybill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedPayments, setLinkedPayments] = useState([]);

  const fetchWaybill = useCallback(async () => {
    try {
      const data = await waybillAPI.getById(id);
      setWaybill(data);
      const prIds = data.paymentRequestIds || (data.paymentRequestId ? [data.paymentRequestId] : []);
      if (prIds.length > 0) {
        const allPayments = await paymentRequestAPI.getAll();
        const linked = allPayments.filter(p => prIds.includes(p.id));
        setLinkedPayments(linked);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchWaybill(); }, [fetchWaybill]);

  const [confirming, setConfirming] = useState(false);
  const userData = getUser();
  const canCrud = canCrudWaybill(userData);
  const canConfirm = canConfirmWaybill(userData);

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Xác nhận vận đơn đã giao thành công?')) return;
    setConfirming(true);
    try {
      await waybillAPI.confirmDelivery(id);
      fetchWaybill();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';

  if (loading) return <div className="page-content"><div className="loading">Đang tải...</div></div>;
  if (error) return <div className="page-content"><div className="error-message">{error}</div></div>;
  if (!waybill) return <div className="page-content"><div className="error-message">Không tìm thấy vận đơn.</div></div>;

  const products = waybill.products ? (typeof waybill.products === 'string' ? JSON.parse(waybill.products) : waybill.products) : [];

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Chi tiết vận đơn — {waybill.waybillCode}</h1>
          <p className="page-subtitle">Waybill — theo dõi vận chuyển và đối chiếu kho</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/waybills')}>Quay lại</button>
          {waybill.status !== 'DELIVERED' && waybill.status !== 'CANCELLED' && canConfirm && (
            <button className="btn btn-primary" onClick={handleConfirmDelivery} disabled={confirming}>
              {confirming ? 'Đang xác nhận...' : 'Xác nhận vận đơn thành công'}
            </button>
          )}
          {canCrud && (
            <button className="btn btn-secondary" onClick={() => navigate(`/waybills/edit/${id}`)}>Chỉnh sửa</button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="detail-grid">
          <section className="detail-section">
            <h3>Thông tin chung</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Mã vận đơn</span><span className="value">{waybill.waybillCode}</span></div>
              <div className="info-row"><span className="label">Đơn vị vận chuyển</span><span className="value">{waybill.carrier || '-'}</span></div>
              <div className="info-row"><span className="label">Trạng thái</span><span className={`badge badge-${(waybill.status || '').toLowerCase()}`}>{waybill.status || '-'}</span></div>
              <div className="info-row"><span className="label">Địa chỉ gửi</span><span className="value">{waybill.origin || '-'}</span></div>
              <div className="info-row"><span className="label">Địa chỉ nhận</span><span className="value">{waybill.destination || '-'}</span></div>
              <div className="info-row"><span className="label">SL dự kiến</span><span className="value">{waybill.expectedQty != null ? waybill.expectedQty : '-'}</span></div>
              <div className="info-row"><span className="label">SL thực tế</span><span className="value">{waybill.actualQty != null ? waybill.actualQty : '-'}</span></div>
              <div className="info-row"><span className="label">Ghi chú</span><span className="value">{waybill.note || '-'}</span></div>
            </div>
          </section>
        </div>

        {linkedPayments.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Đề nghị thanh toán liên quan ({linkedPayments.length})</h3>
            {linkedPayments.map(pr => (
              <div key={pr.id} style={{ marginBottom: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong><a href={`/payments/${pr.id}`} className="link">{formatDnttCode(pr.id)}</a></strong>
                  <span className="muted-copy">{pr.type === 'VAN_CHUYEN' ? 'Vận chuyển' : 'Mua hàng'}</span>
                </div>
                <div className="info-list" style={{ fontSize: 12 }}>
                  <div className="info-row" style={{ padding: '2px 0' }}>
                    <span className="label">Trạng thái</span>
                    <span className={`badge badge-${(pr.status || '').toLowerCase()}`}>{pr.status || '-'}</span>
                  </div>
                  <div className="info-row" style={{ padding: '2px 0' }}>
                    <span className="label">Số tiền</span>
                    <span className="value money">{Number(pr.amountVnd || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {pr.type === 'VAN_CHUYEN' && pr.sourceDnttIds && (() => {
                    let sourceIds = [];
                    try { sourceIds = JSON.parse(pr.sourceDnttIds); } catch {}
                    return sourceIds.length > 0 ? (
                      <div className="info-row" style={{ padding: '2px 0' }}>
                        <span className="label">DNTT Mua hàng nguồn</span>
                        <span className="value">{sourceIds.map(sid => <a key={sid} href={`/payments/${sid}`} className="link" style={{ marginRight: 4 }}>{formatDnttCode(sid)}</a>)}</span>
                      </div>
                    ) : null;
                  })()}
                  {pr.type === 'VAN_CHUYEN' && pr.poIds && pr.poIds.length > 0 && (
                    <div className="info-row" style={{ padding: '2px 0' }}>
                      <span className="label">Mã đơn (PO)</span>
                      <span className="value">{pr.poIds.map(poId => `PO-${poId}`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {products.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Danh sách sản phẩm ({products.length})</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Tên SP</th>
                    <th style={{ width: 110 }}>Mã POS</th>
                    <th style={{ width: 80 }}>Chi tiết</th>
                    <th style={{ width: 70 }}>SL</th>
                    <th style={{ width: 110 }}>Đơn giá</th>
                    <th style={{ width: 60 }}>TG</th>
                  </tr>
                </thead>
                <tbody>
                  {products.flatMap((p, idx) => {
                    const pVariants = parseVariants(p.spec);
                    const hasVariants = pVariants.some(v => v.name || v.qty);
                    const rows = [];
                    rows.push(
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{p.productName}</td>
                        <td>{p.posCode || '-'}</td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (p.spec || '-') : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                        <td>{p.orderedQty}</td>
                        <td>{Number(p.unitPrice || 0).toLocaleString()}</td>
                        <td>{p.currency || 'CNY'}</td>
                      </tr>
                    );
                    if (hasVariants) {
                      pVariants.forEach((v, vi) => {
                        if (!v.name && !v.qty) return;
                        rows.push(
                          <tr key={`${idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                            <td></td>
                            <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569' }}>
                              <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                            </td>
                            <td></td>
                            <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                            <td>{v.qty || 0}</td>
                            <td></td>
                            <td></td>
                          </tr>
                        );
                      });
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default WaybillDetail;
