import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { waybillAPI, paymentRequestAPI, shipmentTrackingAPI, exchangeRateAPI } from '../services/api';
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
  const [trackings, setTrackings] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);

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
      shipmentTrackingAPI.getByWaybillId(id).then(setTrackings).catch(() => {});
      exchangeRateAPI.getAll().then(rates => {
        const map = {};
        rates.forEach(r => { map[r.currency] = r.rate; });
        setExchangeRates(map);
        setRatesLoading(false);
      }).catch(() => setRatesLoading(false));
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
  const groupedByPO = {};
  products.forEach(p => {
    const key = p.poCode || 'PO-' + (p.poId || '');
    if (!groupedByPO[key]) groupedByPO[key] = [];
    groupedByPO[key].push(p);
  });

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
                </div>
              </div>
            ))}
          </section>
        )}

        {products.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Danh sách sản phẩm ({products.length})</h3>
            {Object.entries(groupedByPO).map(([poCode, items]) => (
              <div key={poCode} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#2563eb', marginBottom: 8, padding: '6px 10px', background: '#f0f7ff', borderRadius: 6 }}>
                  {poCode} ({items.length} sản phẩm)
                </div>
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Tên SP</th>
                        <th style={{ width: 110 }}>Mã POS</th>
                        <th style={{ width: 80 }}>Chi tiết</th>
                        <th style={{ width: 60 }}>SL</th>
                        <th style={{ width: 70 }}>Số kiện</th>
                        <th style={{ width: 100 }}>Đơn giá</th>
                        <th style={{ width: 120 }}>Tỷ giá → VND</th>
                        <th style={{ width: 100 }}>Thành tiền</th>
                        <th style={{ width: 100 }}>Quy đổi VNĐ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.flatMap((p, idx) => {
                        const pVariants = parseVariants(p.spec);
                        const hasVariants = pVariants.some(v => v.name || v.qty);
                        const rows = [];
                        const rate = Number(p.exchangeRate || exchangeRates[p.currency] || 0);
                        const sub = (Number(p.unitPrice) || 0) * (Number(p.orderedQty) || 0);
                        const vnd = Math.round(sub * rate);
                        rows.push(
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{p.productName}</td>
                            <td>{p.posCode || '-'}</td>
                            <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (p.spec || '-') : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td>{p.orderedQty}</td>
                            <td>{p.packageCount || p.orderedQty || '-'}</td>
                            <td>{Number(p.unitPrice || 0).toLocaleString()} {p.currency || 'CNY'}</td>
                            <td style={{ fontSize: 11 }}>1 {p.currency || 'CNY'} = {Number(p.exchangeRate || exchangeRates[p.currency] || 0).toLocaleString()} VND</td>
                            <td>{sub.toLocaleString()} {p.currency || 'CNY'}</td>
                            <td className="money">{vnd.toLocaleString('vi-VN')} ₫</td>
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
              </div>
            ))}
          </section>
        )}

        {products.length > 0 && (
          <section className="detail-section" style={{ marginTop: 16, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Tỷ giá tham chiếu từ hệ thống</h4>
            {!ratesLoading && Object.keys(exchangeRates).length > 0 && (
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                {Array.from(new Set(products.map(p => p.currency || 'CNY'))).sort().map(currency => {
                  const sysRate = exchangeRates[currency];
                  if (!sysRate) return null;
                  return (
                    <span key={currency} style={{ display: 'inline-block', marginRight: 16, background: '#e0f2fe', padding: '4px 10px', borderRadius: 4 }}>
                      1 <strong>{currency}</strong> = <strong>{Number(sysRate).toLocaleString()} VND</strong>
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              {Array.from(new Set(products.map(p => p.currency || 'CNY'))).sort().map(currency => {
                const items = products.filter(p => (p.currency || 'CNY') === currency);
                const totalForeign = items.reduce((s, p) => s + (Number(p.unitPrice) || 0) * (Number(p.orderedQty) || 0), 0);
                const storedRate = items[0]?.exchangeRate;
                const sysRate = exchangeRates[currency];
                const rate = Number(storedRate || sysRate || 0);
                const totalVnd = Math.round(totalForeign * rate);
                return (
                  <div key={currency}>
                    Tổng ({currency}): <strong>{totalForeign.toLocaleString()} {currency}</strong>
                    {' × '} {rate.toLocaleString()} (tỷ giá) = <strong style={{ color: '#dc2626' }}>{totalVnd.toLocaleString('vi-VN')} VND</strong>
                    {storedRate && sysRate && Number(storedRate) !== Number(sysRate) && (
                      <span style={{ color: '#d97706', fontSize: 11, marginLeft: 8 }}>
                        (tỷ giá hệ thống: {Number(sysRate).toLocaleString()})
                      </span>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                Tổng cộng quy đổi: <strong style={{ color: '#dc2626', fontSize: 16 }}>
                  {products.reduce((s, p) => {
                    const r = Number(p.exchangeRate || exchangeRates[p.currency] || 0);
                    const sub = (Number(p.unitPrice) || 0) * (Number(p.orderedQty) || 0);
                    return s + Math.round(sub * r);
                  }, 0).toLocaleString('vi-VN')} VND
                </strong>
              </div>
            </div>
          </section>
        )}

        {trackings.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Lịch sử vận chuyển ({trackings.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trackings.map(t => (
                <div key={t.id} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className={`badge badge-${(t.status || '').toLowerCase()}`}>{t.status || '-'}</span>
                    <span className="muted-copy">{t.eventDate ? new Date(t.eventDate).toLocaleString('vi-VN') : '-'}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>{t.eventDescription || '-'}</div>
                  {t.location && <div className="muted-copy" style={{ marginTop: 2 }}>📍 {t.location}</div>}
                  {t.updatedBy && <div className="muted-copy" style={{ marginTop: 2 }}>Người cập nhật: {t.updatedBy}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default WaybillDetail;
