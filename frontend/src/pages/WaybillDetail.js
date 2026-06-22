import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { waybillAPI, purchaseOrderAPI, paymentRequestAPI, shipmentTrackingAPI, exchangeRateAPI } from '../services/api';
import CommentSection from '../components/CommentSection';
import { formatDnttCode } from '../utils/paymentUtils';
import { canCrudWaybill, canConfirmWaybill, getUser } from '../utils/permissions';

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
  const [poShippingMap, setPoShippingMap] = useState({});

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

      const products = data.products ? (typeof data.products === 'string' ? JSON.parse(data.products) : data.products) : [];
      const poIds = [...new Set(products.map(p => p.poId).filter(Boolean))];
      if (poIds.length > 0) {
        const poData = await purchaseOrderAPI.getAll('', 0, 10000);
        const orders = poData.orders || [];
        const map = {};
        orders.filter(o => poIds.includes(o.id)).forEach(o => {
          map[o.id] = o.shippingMethod || '';
        });
        setPoShippingMap(map);
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
                        <th style={{ width: 28 }}>#</th>
                        <th>PO</th>
                        <th style={{ minWidth: 120 }}>Sản phẩm</th>
                        <th>SL</th>
                        <th style={{ width: 70 }}>KL/T.tích</th>
                        <th style={{ width: 85 }}>Đơn giá VC</th>
                        <th style={{ width: 80 }}>Tỷ giá</th>
                        <th style={{ width: 90 }}>Tổng cước</th>
                        <th style={{ width: 100 }}>Cước VC (VNĐ)</th>
                        <th style={{ width: 100 }}>Số kiện</th>
                        <th style={{ width: 100 }}>H.thức VC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.flatMap((p, idx) => {
                        const totalCny = (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0);
                        const totalVnd = Math.round(totalCny * (Number(p.exchangeRate) || 3520));
                        const rows = [];
                        rows.push(
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td style={{ fontSize: 11 }}>
                              {p.poId ? (
                                <a href={`/purchase-orders/${p.poId}`} className="link" style={{ fontSize: 11 }}
                                  onClick={e => { e.preventDefault(); navigate(`/purchase-orders/${p.poId}`); }}>
                                  {p.poCode}
                                </a>
                              ) : p.poCode}
                            </td>
                            <td>{p.productName}{p.posCode ? ` (${p.posCode})` : ''}</td>
                            <td>{p.orderedQty}</td>
                            <td>{Number(p.volume || 0).toLocaleString('vi-VN')}</td>
                            <td>{Number(p.unitPriceVC || 0).toLocaleString('vi-VN')}</td>
                            <td style={{ fontSize: 11 }}>1 {p.currency || 'CNY'} = {Number(p.exchangeRate || 3520).toLocaleString()} VND</td>
                            <td style={{ fontWeight: 600 }}>{totalCny.toLocaleString('vi-VN')} {p.currency || 'CNY'}</td>
                            <td style={{ fontWeight: 600 }} className="money">{totalVnd.toLocaleString('vi-VN')} ₫</td>
                            <td>{p.packageCount || p.orderedQty || '-'}</td>
                            <td>{p.shippingMethod || poShippingMap[p.poId] || '-'}</td>
                          </tr>
                        );
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
                const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);
                const rate = items[0]?.exchangeRate || exchangeRates[currency] || '3520';
                const totalVnd = Math.round(totalForeign * Number(rate));
                return (
                  <div key={currency}>
                    Tổng cước ({currency}): <strong>{totalForeign.toLocaleString('vi-VN')} {currency}</strong>
                    {' × '} {Number(rate).toLocaleString()} (tỷ giá) = <strong style={{ color: '#dc2626' }}>{totalVnd.toLocaleString('vi-VN')} VND</strong>
                  </div>
                );
              })}
              <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                Tổng cước VC: <strong style={{ color: '#dc2626', fontSize: 16 }}>
                  {products.reduce((s, p) => {
                    const rate = Number(p.exchangeRate || exchangeRates[p.currency] || 3520);
                    return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);
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
      <CommentSection entityType="WAYBILL" entityId={waybill.id} />
    </div>
  );
}

export default WaybillDetail;
