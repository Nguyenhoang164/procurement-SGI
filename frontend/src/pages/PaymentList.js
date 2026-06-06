import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { paymentRequestAPI, purchaseOrderAPI, resolveFileUrl } from '../services/api';
import {
  canCreatePayment,
  formatDnttCode,
  formatMoney,
  formatPoCode,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  parseAttachmentUrls,
  getAttachmentFileName
} from '../utils/paymentUtils';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [detailOrders, setDetailOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentRequestAPI.getAll();
      setPayments(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (payment) => {
    setDetailLoading(true);
    setUploadFiles([]);
    try {
      const data = await paymentRequestAPI.getById(payment.id);
      setDetailModal(data);
      if (data.poIds && data.poIds.length > 0) {
        const poData = await Promise.all(data.poIds.map(poId => purchaseOrderAPI.getById(poId)));
        setDetailOrders(poData);
      } else {
        setDetailOrders([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal(null);
    setDetailOrders([]);
    setUploadFiles([]);
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || !detailModal) return;
    setUploading(true);
    try {
      await paymentRequestAPI.uploadAttachments(detailModal.id, uploadFiles);
      setUploadFiles([]);
      openDetailModal({ id: detailModal.id });
    } catch (err) {
      alert('Lỗi tải file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đề nghị thanh toán này?')) {
      return;
    }

    try {
      await paymentRequestAPI.delete(id);
      setPayments((current) => current.filter((payment) => payment.id !== id));
      if (detailModal && detailModal.id === id) closeDetailModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingCount = payments.filter((item) => item.status?.startsWith('PENDING')).length;
  const pendingL1 = payments.filter((item) => item.status === 'PENDING_L1').length;
  const pendingL2 = payments.filter((item) => item.status === 'PENDING_L2').length;
  const allowCreate = canCreatePayment(user);

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Đề nghị thanh toán (DNTT)</h1>
          <p className="page-subtitle">Danh sách DNTT và trạng thái phê duyệt đa cấp</p>
        </div>
        <div className="page-actions">
          {allowCreate ? (
            <button className="btn btn-primary" onClick={() => navigate('/payments/new')}>
              + Lập DNTT mới
            </button>
          ) : null}
        </div>
      </div>

      <div className="page-content">
        <div className="alert warn">
          <div className="muted-copy" style={{ flex: 1 }}>
            <strong>{pendingCount} DNTT</strong> đang cần xử lý hoặc phê duyệt
            {pendingCount > 0 ? ` — ${pendingL1} chờ duyệt L1, ${pendingL2} chờ duyệt L2` : ''}.
          </div>
          {pendingCount > 0 ? (
            <button type="button" className="btn btn-sm" onClick={() => navigate('/notifications')}>
              Xem ngay
            </button>
          ) : null}
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có đề nghị thanh toán nào.</p>
            {allowCreate ? (
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/payments/new')}>
                + Lập DNTT mới
              </button>
            ) : null}
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Mã DNTT</th>
                    <th>Liên kết PO</th>
                    <th style={{ width: 140 }}>Loại</th>
                    <th style={{ width: 140 }}>Số tiền</th>
                    <th style={{ width: 140 }}>Trạng thái</th>
                    <th style={{ width: 60 }}></th>
                    <th style={{ width: 150 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="clickable" onClick={() => navigate(`/payments/${payment.id}`)}>
                      <td>{formatDnttCode(payment.id)}</td>
                      <td>{formatPoCode(payment.poId)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{payment.type === 'VAN_CHUYEN' ? '🚢' : '📦'}</span>
                          {getPaymentTypeLabel(payment.type)}
                        </span>
                      </td>
                      <td className="money">{Number(payment.amountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadgeClass(payment.status)}`}>
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-icon-eye"
                          onClick={(e) => { e.stopPropagation(); openDetailModal(payment); }}
                          title="Xem hàng hóa & minh chứng"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          👁️
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-sm btn-view" onClick={(e) => { e.stopPropagation(); navigate(`/payments/${payment.id}`); }}>
                                Chi tiết
                            </button>
                            <button className="btn btn-sm btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(payment.id); }}>
                                Xóa
                            </button>
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

      {detailModal && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-card-detail" onClick={e => e.stopPropagation()}
            style={{ width: 'min(900px, 95vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{formatDnttCode(detailModal.id)}</h2>
              <button onClick={closeDetailModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', padding: '4px 8px', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
              {detailLoading ? (
                <p>Đang tải...</p>
              ) : (
                <>
                  {/* Header info */}
                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <div className="info-list">
                        <div className="info-row"><span className="label">Loại thanh toán</span><span className="value">{getPaymentTypeLabel(detailModal.type)}</span></div>
                        <div className="info-row"><span className="label">Số tiền</span><span className="value money">{Number(detailModal.amountVnd || 0).toLocaleString('vi-VN')} ₫</span></div>
                        <div className="info-row"><span className="label">Trạng thái</span><span className={`badge ${getPaymentStatusBadgeClass(detailModal.status)}`}>{getPaymentStatusLabel(detailModal.status)}</span></div>
                        {detailModal.note && <div className="info-row"><span className="label">Ghi chú</span><span className="value">{detailModal.note}</span></div>}
                      </div>
                    </div>
                    <div>
                      <div className="info-list">
                        <div className="info-row"><span className="label">Người tạo</span><span className="value">{detailModal.createdBy || '-'}</span></div>
                        <div className="info-row"><span className="label">Ngày tạo</span><span className="value">{new Date(detailModal.createdAt).toLocaleString('vi-VN')}</span></div>
                        <div className="info-row"><span className="label">Liên kết PO</span><span className="value">{detailModal.poIds ? detailModal.poIds.map(id => formatPoCode(id)).join(', ') : '-'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Printable voucher section */}
                  {detailOrders.length > 0 && (
                    <section style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: 15 }}>Đơn hàng liên quan</h4>
                      {detailOrders.map((order) => (
                        <div key={order.id} style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                            <span><strong>Mã PO:</strong> {order.poCode || 'PO-' + order.id}</span>
                            <span><strong>Nhà cung cấp:</strong> {order.supplierName || '-'}</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ textAlign: 'left', padding: '2px' }}>STT</th>
                                  <th style={{ textAlign: 'left', padding: '2px' }}>Sản phẩm</th>
                                  <th style={{ textAlign: 'left', padding: '2px' }}>Chi tiết</th>
                                  <th style={{ textAlign: 'center', padding: '2px', width: 30 }}>Số lượng</th>
                                  <th style={{ textAlign: 'right', padding: '2px' }}>Đơn giá</th>
                                  <th style={{ textAlign: 'right', padding: '2px' }}>Thành tiền</th>
                                  <th style={{ textAlign: 'center', padding: '2px' }}>Tỉ giá</th>
                                  <th style={{ textAlign: 'right', padding: '2px' }}>Quy đổi VNĐ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.flatMap((item, idx) => {
                                  const subForeign = (Number(item.unitPrice || 0) * Number(item.orderedQty || 0));
                                  const rate = Number(item.exchangeRate || 0);
                                  const subVnd = Math.round(subForeign * (rate || 1));
                                  let itemVariants = [];
                                  let hasVariants = false;
                                  try {
                                    const parsed = JSON.parse(item.spec || '[]');
                                    if (Array.isArray(parsed)) {
                                      itemVariants = parsed;
                                      hasVariants = parsed.some(v => v.name || v.qty);
                                    }
                                  } catch { }
                                  const rows = [];
                                  rows.push(
                                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '2px' }}>{idx + 1}</td>
                                    <td style={{ padding: '2px' }}>{item.productName || '-'}</td>
                                    <td style={{ padding: '2px', fontSize: 10, color: '#64748b' }}>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                                    <td style={{ textAlign: 'center', padding: '2px' }}>{item.orderedQty ?? '-'}</td>
                                    <td style={{ textAlign: 'right', padding: '2px' }}>{Number(item.unitPrice || 0).toLocaleString('vi-VN')} {item.currency || '₫'}</td>
                                    <td style={{ textAlign: 'right', padding: '2px', whiteSpace: 'nowrap' }}>{subForeign.toLocaleString('vi-VN')} {item.currency || '₫'}</td>
                                    <td style={{ textAlign: 'center', padding: '2px', fontSize: 10, color: '#64748b' }}>{rate > 0 ? rate.toLocaleString('vi-VN') : '-'}</td>
                                    <td style={{ textAlign: 'right', padding: '2px', whiteSpace: 'nowrap' }}>{subVnd.toLocaleString('vi-VN')} ₫</td>
                                  </tr>
                                  );
                                  if (hasVariants) {
                                    itemVariants.forEach((v, vi) => {
                                      if (!v.name && !v.qty) return;
                                      rows.push(
                                        <tr key={`${item.id || idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                                          <td></td>
                                          <td style={{ paddingLeft: 24, fontSize: 11, color: '#475569' }}>
                                            <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                                            {v.qty ? <span style={{ marginLeft: 4, color: '#64748b' }}>({v.qty})</span> : null}
                                          </td>
                                          <td colSpan={6}></td>
                                        </tr>
                                      );
                                    });
                                  }
                                  return rows;
                                })}
                              </tbody>
                            </table>
                          )}
                          <div style={{ marginTop: 6, fontSize: 12, textAlign: 'right', color: '#475569' }}>
                            {(order.items || []).length > 0 && order.items[0].exchangeRate ? (
                              <span style={{ fontSize: 11, color: '#64748b', marginRight: 12 }}>
                                TG: 1 {order.items[0].currency || 'CNY'} = {Number(order.items[0].exchangeRate).toLocaleString('vi-VN')} ₫
                              </span>
                            ) : null}
                            <strong style={{ fontSize: 13 }}>Tiền lô: {formatMoney(order.totalLotCostVnd)} ₫</strong>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Financial summary */}
                  <section style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: 15 }}>Chi tiết thanh toán</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 8px', width: '40%', fontWeight: 600 }}>1. Số tiền tạm ứng (nếu có):</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(detailModal.advanceAmountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                        </tr>
                        <tr style={{ borderTop: '1px dashed #94a3b8' }}>
                          <td style={{ padding: '4px 8px', fontWeight: 600 }}>2. Số tiền đã chi:</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(detailModal.amountSpentVnd || 0).toLocaleString('vi-VN')} ₫</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #1e3a5f' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: '#1e3a5f' }}>3. Đề nghị thanh toán số tiền:</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1e3a5f' }}>{Number(detailModal.amountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                        </tr>
                      </tbody>
                    </table>
                    {(Number(detailModal.exchangeRateDiffVnd || 0) > 0 || Number(detailModal.additionalShippingVnd || 0) > 0 || (detailModal.customFees && detailModal.customFees.length > 0)) && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        {Number(detailModal.exchangeRateDiffVnd || 0) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                            <span>Chênh lệch tỉ giá:</span>
                            <span>{Number(detailModal.exchangeRateDiffVnd).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        )}
                        {Number(detailModal.additionalShippingVnd || 0) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                            <span>Phí vận chuyển bổ sung:</span>
                            <span>{Number(detailModal.additionalShippingVnd).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        )}
                        {detailModal.customFees && detailModal.customFees.map((fee, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                            <span>{fee.feeName}:</span>
                            <span>{Number(fee.feeAmount).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontWeight: 700, borderTop: '1px solid #cbd5e1', marginTop: 4 }}>
                          <span>Tổng thanh toán:</span>
                          <span>{(
                            Number(detailModal.amountVnd || 0) +
                            Number(detailModal.exchangeRateDiffVnd || 0) +
                            Number(detailModal.additionalShippingVnd || 0) +
                            (detailModal.customFees || []).reduce((s, f) => s + (Number(f.feeAmount) || 0), 0)
                          ).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Reason & notes */}
                  {(detailModal.reason || detailModal.note) && (
                    <section style={{ marginBottom: 20, fontSize: 14 }}>
                      {detailModal.reason && <p><strong>Lý do thanh toán:</strong> {detailModal.reason}</p>}
                      {detailModal.note && <p><strong>Ghi chú:</strong> {detailModal.note}</p>}
                    </section>
                  )}

                  {/* Attachments */}
                  <section style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, marginBottom: 8 }}>Minh chứng đính kèm</h3>
                    {(() => {
                      const urls = parseAttachmentUrls(detailModal.attachments);
                      return urls.length === 0 ? (
                        <p className="muted-copy" style={{ fontSize: 13 }}>Chưa có file minh chứng.</p>
                      ) : (
                        <div className="attachment-gallery" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {urls.map((url) => {
                            const fullUrl = resolveFileUrl(url);
                            const name = getAttachmentFileName(url);
                            const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
                            return (
                              <div key={url} className="attachment-card" style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {isImage ? (
                                  <a href={fullUrl} target="_blank" rel="noreferrer">
                                    <img src={fullUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </a>
                                ) : (
                                  <a href={fullUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: '#2563eb', textDecoration: 'underline', padding: 4, textAlign: 'center', wordBreak: 'break-all' }}>{name}</a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                        style={{ fontSize: 13, flex: 1 }} />
                      <button className="btn btn-sm btn-primary" onClick={handleUpload}
                        disabled={!uploadFiles.length || uploading}>
                        {uploading ? 'Đang tải...' : 'Tải lên'}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentList;
