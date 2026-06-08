import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { paymentRequestAPI, productAPI, purchaseOrderAPI, resolveFileUrl, waybillAPI, bankAccountAPI } from '../services/api';
import {
  canCreatePayment,
  canEditPayment,
  canAccountingCheck,
  formatDnttCode,
  formatPoCode,
  getAttachmentFileName,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  parseAttachmentUrls,
  PAPER_TYPES,
  numberToWords,
  formatMoney
} from '../utils/paymentUtils';
import { isAdmin, canApprovePR_L1, canApprovePR_L2, canPayPR, canEditPaymentByRole, canRejectPR } from '../utils/permissions';

function PaymentRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [orders, setOrders] = useState([]);
  const [waybills, setWaybills] = useState([]);
  const [warehouseReceipts, setWarehouseReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [showPayModal, setShowPayModal] = useState(false);
  const [payConfirmedBy, setPayConfirmedBy] = useState('');
  const [payFiles, setPayFiles] = useState([]);
  const [paying, setPaying] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [bankAccountInfo, setBankAccountInfo] = useState(null);
  const [showNewBankAccount, setShowNewBankAccount] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({ accountNumber: '', accountHolder: '', bankName: '' });
  const [newBankAccountQrFile, setNewBankAccountQrFile] = useState(null);
  const [bankNames, setBankNames] = useState([]);
  const [showAddBankName, setShowAddBankName] = useState(false);
  const [newBankNameInput, setNewBankNameInput] = useState('');
  const [paymentList, setPaymentList] = useState([]);
  const [selectedOtherDnttIds, setSelectedOtherDnttIds] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [quickViewDntt, setQuickViewDntt] = useState(null);
  const [quickViewDnttLoading, setQuickViewDnttLoading] = useState(false);
  const [quickViewDnttOrders, setQuickViewDnttOrders] = useState([]);
  const [rejectCategory, setRejectCategory] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await paymentRequestAPI.getById(id);
      setRequest(data);

      if (data.poIds && data.poIds.length > 0) {
        const poData = await Promise.all(data.poIds.map(poId => purchaseOrderAPI.getById(poId)));
        setOrders(poData);
      }

      if (data.waybillIds && data.waybillIds.length > 0) {
        const wbData = await waybillAPI.getByIds(data.waybillIds);
        setWaybills(Array.isArray(wbData) ? wbData : [wbData]);
      }

      if (data.warehouseReceipts) {
        setWarehouseReceipts(data.warehouseReceipts);
      }

      if (data.bankAccountId) {
        bankAccountAPI.getById(data.bankAccountId).then(setBankAccountInfo).catch(() => {});
      } else {
        setBankAccountInfo(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    productAPI.getAll().then(products => {
      const map = {};
      products.forEach(p => { if (p.posCode) map[p.posCode] = p.productName; });
      setProductMap(map);
    }).catch(() => {});
    bankAccountAPI.getAll().then(setBankAccounts).catch(() => {});
    bankAccountAPI.getBankNames().then(setBankNames).catch(() => {});
    paymentRequestAPI.getAll().then(list => setPaymentList(list.filter(p => String(p.id) !== id))).catch(() => {});
  }, [id]);

  const handleApproveL1 = async () => {
    try {
      await paymentRequestAPI.approveL1(id);
      fetchDetail();
    } catch (err) {
      alert("Lỗi phê duyệt L1: " + err.message);
    }
  };

  const handleApproveL2 = async () => {
    try {
      await paymentRequestAPI.approveL2(id);
      fetchDetail();
    } catch (err) {
      alert("Lỗi phê duyệt L2: " + err.message);
    }
  };

  const handleAccountingCheck = async () => {
    try {
      await paymentRequestAPI.accountingCheck(id, user?.username || 'Kế toán');
      fetchDetail();
    } catch (err) {
      alert("Lỗi duyệt chi: " + err.message);
    }
  };

  const openRejectModal = () => {
    setRejectCategory('');
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const reason = rejectCategory + (rejectComment ? `: ${rejectComment}` : '');
      await paymentRequestAPI.reject(id, reason, user?.username);
      setShowRejectModal(false);
      fetchDetail();
    } catch (err) {
      alert("Lỗi từ chối: " + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const openQuickViewDntt = async (dnttId) => {
    setQuickViewDnttLoading(true);
    try {
      const data = await paymentRequestAPI.getById(dnttId);
      setQuickViewDntt(data);
      if (data.poIds && data.poIds.length > 0) {
        const poData = await Promise.all(data.poIds.map(poId => purchaseOrderAPI.getById(poId)));
        setQuickViewDnttOrders(poData);
      } else {
        setQuickViewDnttOrders([]);
      }
    } catch (err) {
      alert('Lỗi tải thông tin DNTT: ' + err.message);
    } finally {
      setQuickViewDnttLoading(false);
    }
  };

  const closeQuickViewDntt = () => {
    setQuickViewDntt(null);
    setQuickViewDnttOrders([]);
  };

  const REJECT_CATEGORIES = [
    { value: 'Sai thông tin', label: 'Sai thông tin' },
    { value: 'Thiếu chứng từ', label: 'Thiếu chứng từ' },
    { value: 'Sai số tiền', label: 'Sai số tiền' },
    { value: 'Chưa đủ điều kiện', label: 'Chưa đủ điều kiện' },
    { value: 'Khác', label: 'Khác' },
  ];

  const handlePrint = () => {
    const printEl = document.querySelector('.printable-view');
    if (!printEl) return window.print();
    const win = window.open('', '_blank');
    if (!win) return window.print();
    win.document.write(`<!DOCTYPE html><html><head><title>Đề nghị thanh toán</title>
      <style>
        body { font-family:'Segoe UI',sans-serif; font-size:14px; padding:40px; color:#111827; }
        @page { margin:20mm; }
        hr { border:none; border-top:1px solid #cbd5e1; }
        table { width:100%; border-collapse:collapse; }
        th { text-align:left; padding:3px; }
        td { padding:3px; }
        .no-print { display:none !important; }
      </style></head><body>${printEl.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handlePay = async () => {
    if (!payConfirmedBy.trim()) { alert('Vui lòng nhập người thực hiện chuyển khoản.'); return; }
    setPaying(true);
    try {
      let bankAccountId = selectedBankAccountId ? Number(selectedBankAccountId) : null;

      if (showNewBankAccount) {
        if (!newBankAccount.accountNumber.trim() || !newBankAccount.accountHolder.trim() || !newBankAccount.bankName.trim()) {
          alert('Vui lòng nhập đầy đủ thông tin tài khoản mới (số TK, chủ TK, ngân hàng).');
          setPaying(false); return;
        }
        const created = await bankAccountAPI.create({
          accountNumber: newBankAccount.accountNumber.trim(),
          accountHolder: newBankAccount.accountHolder.trim(),
          bankName: newBankAccount.bankName.trim()
        });
        bankAccountId = created.id;
        if (newBankAccountQrFile) {
          await bankAccountAPI.uploadQrCode(created.id, newBankAccountQrFile);
        }
        const updatedList = await bankAccountAPI.getAll();
        setBankAccounts(updatedList);
      }

      if (payFiles.length > 0) {
        await paymentRequestAPI.uploadAttachments(id, payFiles);
      }

      if (selectedOtherDnttIds.length > 0 && payFiles.length > 0) {
        for (const otherId of selectedOtherDnttIds) {
          await paymentRequestAPI.uploadAttachments(otherId, payFiles);
        }
      }

      await paymentRequestAPI.pay(id, payConfirmedBy.trim(), bankAccountId);
      setShowPayModal(false);
      setPayConfirmedBy('');
      setPayFiles([]);
      setSelectedBankAccountId('');
      setShowNewBankAccount(false);
      setNewBankAccount({ accountNumber: '', accountHolder: '', bankName: '' });
      setNewBankAccountQrFile(null);
      setSelectedOtherDnttIds([]);
      fetchDetail();
    } catch (err) {
      alert("Lỗi xác nhận thanh toán: " + err.message);
    } finally { setPaying(false); }
  };

  if (loading) return <div className="page-content"><div className="loading">Đang tải dữ liệu...</div></div>;
  if (error) return <div className="page-content"><div className="error-message">{error}</div></div>;
  if (!request) return <div className="page-content"><div className="error-message">Không tìm thấy yêu cầu thanh toán.</div></div>;

  const isAdminUser = isAdmin(user);
  const canEdit = canEditPaymentByRole(user) && canEditPayment(request);
  const canDoL1 = canApprovePR_L1(user);
  const canDoL2 = canApprovePR_L2(user);
  const canDoAccountingCheck = canAccountingCheck(user);
  const canDoPay = canPayPR(user);
  const canDoReject = canRejectPR(user);
  const attachmentUrls = parseAttachmentUrls(request.attachments);
  const customFees = request.customFees || [];
  const exchangeRateDiff = Number(request.exchangeRateDiffVnd) || 0;
  const additionalShipping = Number(request.additionalShippingVnd) || 0;
  const totalExtra = exchangeRateDiff + additionalShipping + customFees.reduce((s, f) => s + Number(f.feeAmount || 0), 0);

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Đề nghị thanh toán — {formatDnttCode(request.id)}</h1>
          <p className="page-subtitle">Chi tiết phê duyệt và thông tin thanh toán</p>
        </div>
         <div className="page-actions">
           <button className="btn btn-secondary" onClick={() => navigate('/payments')}>Quay lại</button>

            {canEdit && (
              <button className="btn btn-secondary" onClick={() => navigate(`/payments/edit/${id}`)}>Chỉnh sửa</button>
            )}

            <button className="btn btn-outline" onClick={handlePrint}>
              In đề nghị
            </button>

            {request.status === 'PENDING_L1' && (canDoL1 || canDoReject) && (
              <>
                {canDoReject && (
                  <button className="btn btn-danger" onClick={openRejectModal}>Từ chối</button>
                )}
                {canDoL1 && (
                  <button className="btn btn-primary" onClick={handleApproveL1}>Phê duyệt L1</button>
                )}
              </>
            )}

            {request.status === 'ACCOUNTING_CHECK' && (canDoAccountingCheck || canDoReject) && (
              <>
                {canDoReject && (
                  <button className="btn btn-danger" onClick={openRejectModal}>Từ chối</button>
                )}
                {canDoAccountingCheck && (
                  <button className="btn btn-primary" onClick={handleAccountingCheck}>Kế toán duyệt chi</button>
                )}
              </>
            )}

            {request.status === 'PENDING_L2' && (canDoL2 || canDoReject) && (
              <>
                {canDoReject && (
                  <button className="btn btn-danger" onClick={openRejectModal}>Từ chối</button>
                )}
                {canDoL2 && (
                  <button className="btn btn-primary" onClick={handleApproveL2}>Phê duyệt L2 (Final)</button>
                )}
              </>
            )}

           {request.status === 'APPROVED' && canDoPay && (
              <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>Xác nhận Đã thanh toán</button>
            )}
         </div>
      </div>

      {request.status === 'REJECTED' && (
        <div className="page-content">
          <section className="detail-section" style={{ borderLeft: '4px solid #dc2626' }}>
            <h3 style={{ color: '#dc2626' }}>Đã từ chối</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="label">Mức từ chối</span>
                <span className="value" style={{ fontWeight: 600 }}>
                  {request.rejectedLevel === 'L2' ? 'Phê duyệt L2' : request.rejectedLevel === 'ACCOUNTING' ? 'Kế toán duyệt chi' : 'Phê duyệt L1'}
                </span>
              </div>
              {request.rejectedBy && (
                <div className="info-row"><span className="label">Người từ chối</span><span className="value">{request.rejectedBy}</span></div>
              )}
              {request.rejectedAt && (
                <div className="info-row"><span className="label">Thời gian</span><span className="value">{new Date(request.rejectedAt).toLocaleString('vi-VN')}</span></div>
              )}
              {request.rejectReason && (
                <div className="info-row"><span className="label">Lý do</span><span className="value" style={{ color: '#dc2626', fontStyle: 'italic' }}>{request.rejectReason}</span></div>
              )}
            </div>
          </section>
        </div>
      )}

          <div className="detail-grid">
          <section className="detail-section">
            <h3>Thông tin đề nghị</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Mã DNTT</span><span className="value">{formatDnttCode(request.id)}</span></div>
              <div className="info-row"><span className="label">Loại thanh toán</span><span className="value">{getPaymentTypeLabel(request.type)}</span></div>
              <div className="info-row"><span className="label">Số tiền</span><span className="value money" style={request.status === 'REJECTED' ? { color: '#dc2626' } : {}}>{Number(request.amountVnd || 0).toLocaleString('vi-VN')} ₫</span></div>
              <div className="info-row"><span className="label">Loại tiền tệ</span><span className="value">{request.currency || 'VND'}</span></div>
              <div className="info-row"><span className="label">Trạng thái</span><span className={`badge ${getPaymentStatusBadgeClass(request.status)}`}>{getPaymentStatusLabel(request.status)}</span></div>
              <div className="info-row"><span className="label">Người tạo</span><span className="value">{request.createdBy || '-'}</span></div>
              <div className="info-row"><span className="label">Ngày tạo</span><span className="value">{new Date(request.createdAt).toLocaleString('vi-VN')}</span></div>
              {request.note ? (
                <div className="info-row"><span className="label">Ghi chú</span><span className="value">{request.note}</span></div>
              ) : null}
              {request.referencePaymentRequestId && (
                <div className="info-row">
                  <span className="label">TK chênh lệch TG</span>
                  <span className="value">
                    <a href={`/payments/${request.referencePaymentRequestId}`} className="link">
                      {formatDnttCode(request.referencePaymentRequestId)}
                    </a>
                    {request.exchangeRateDiffVnd > 0 && (
                      <span style={{ color: '#dc2626', marginLeft: 8 }}>
                        (+{Number(request.exchangeRateDiffVnd).toLocaleString('vi-VN')} ₫)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3>Minh chứng đính kèm</h3>
            {attachmentUrls.length === 0 ? (
              <p className="muted-copy" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>!</span> Chưa có file minh chứng.</p>
            ) : (
              <div className="attachment-gallery">
                {attachmentUrls.map((url) => {
                  const fullUrl = resolveFileUrl(url);
                  const name = getAttachmentFileName(url);
                  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
                  return (
                    <div key={url} className="attachment-card">
                      {isImage ? (
                        <a href={fullUrl} target="_blank" rel="noreferrer">
                          <img src={fullUrl} alt={name} className="attachment-thumb" />
                        </a>
                      ) : (
                        <a href={fullUrl} target="_blank" rel="noreferrer" className="attachment-link">{name}</a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

          {request.type === 'VAN_CHUYEN' && request.shipmentItems && (() => {
            let shipmentItems = [];
            try { shipmentItems = JSON.parse(request.shipmentItems); } catch {}
            let sourceDnttIds = [];
            try { if (request.sourceDnttIds) sourceDnttIds = JSON.parse(request.sourceDnttIds); } catch {}
            return (
              <section className="detail-section" style={{ marginTop: 20 }}>
                <h3>Thông tin vận chuyển</h3>
                {sourceDnttIds.length > 0 && (
                  <div className="info-list" style={{ marginBottom: 12 }}>
                    <div className="info-row"><span className="label">DNTT Mua hàng nguồn</span><span className="value">{sourceDnttIds.map(id => <a key={id} href={`/payments/${id}`} className="link" style={{ marginRight: 6 }}>{formatDnttCode(id)}</a>)}</span></div>
                  </div>
                )}
                {shipmentItems.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>#</th>
                          <th>DNTT</th>
                          <th>PO</th>
                          <th>Mã POS</th>
                          <th>Sản phẩm</th>
                          <th style={{ width: 40 }}>Số lượng</th>
                          <th style={{ width: 100 }}>KL/T.tích</th>
                          <th style={{ width: 100 }}>Đơn giá VC</th>
                          <th style={{ width: 100 }}>Tổng cước</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipmentItems.map((item, idx) => (
                          <tr key={item.key || idx}>
                            <td>{idx + 1}</td>
                            <td style={{ fontSize: 12 }}>{item.sourceDnttCode}</td>
                            <td style={{ fontSize: 12 }}>{item.poCode}</td>
                            <td style={{ fontSize: 12 }}>{item.posCode}</td>
                            <td style={{ fontSize: 12 }}>{item.productName}</td>
                            <td>{item.orderedQty}</td>
                            <td>{item.volume || 0}</td>
                            <td>{Number(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
                            <td style={{ fontWeight: 600 }}>{item.total.toLocaleString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="muted-copy">Chưa có sản phẩm vận chuyển.</p>}
              </section>
            );
          })()}

          <section className="detail-section highlight" style={{ marginTop: 20 }}>
            <h3>Đơn hàng liên quan ({orders.length})</h3>
            {orders.length > 0 ? orders.map((order) => (
              <div key={order.id} style={{ marginBottom: orders.length > 1 ? 16 : 0, padding: orders.length > 1 ? '12px 0' : 0, borderBottom: orders.length > 1 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <a href={`/purchase-orders/${order.id}`} className="link" style={{ fontWeight: 600 }}>
                    {order.poCode || 'PO-' + order.id}
                  </a>
                </div>
                <div className="info-list" style={{ marginBottom: 8 }}>
                  <div className="info-row"><span className="label">Nhà cung cấp</span><span className="value">{order.supplierName || '-'}</span></div>
                  <div className="info-row"><span className="label">Số sản phẩm</span><span className="value">{order.items ? order.items.length : 0}</span></div>
                  <div className="info-row"><span className="label">Trạng thái</span><span className="value">{order.status}</span></div>
                  <div className="info-row">
                    <span className="label">Thanh toán</span>
                    <span className={`badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus) || '—'}
                    </span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="table-wrapper">
                    <table className="table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}>#</th>
                          <th>Tên SP</th>
                          <th style={{ width: 90 }}>Mã POS</th>
                          <th style={{ width: 90 }}>Chi tiết</th>
                          <th style={{ width: 50 }}>Số lượng</th>
                          <th style={{ width: 100 }}>Đơn giá</th>
                          <th style={{ width: 100 }}>Thành tiền</th>
                          <th style={{ width: 100 }}>Quy đổi VNĐ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.flatMap((item, idx) => {
                          const productName = item.productName || productMap[item.posCode] || '-';
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
                            <tr key={item.id || idx}>
                              <td>{idx + 1}</td>
                              <td>{productName}</td>
                              <td>{item.posCode ? <a href="/products" className="link">{item.posCode}</a> : '-'}</td>
                              <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                              <td>{item.orderedQty ?? '-'}</td>
                              <td className="money">{Number(item.unitPrice || 0).toLocaleString('vi-VN')} {item.currency || '₫'}</td>
                              <td className="money">{Number(item.totalAmountForeign || 0).toLocaleString('vi-VN')} {item.currency || '₫'}</td>
                              <td className="money">{Number(item.totalAmountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                            </tr>
                          );
                          if (hasVariants) {
                            itemVariants.forEach((v, vi) => {
                              if (!v.name && !v.qty) return;
                              rows.push(
                                <tr key={`${item.id || idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                                  <td></td>
                                  <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569' }}>
                                    <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                                  </td>
                                  <td></td>
                                  <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                                  <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
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
                )}

                <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 13 }}>
                  <span><span className="muted-copy">Tiền lô:</span> <strong>{formatMoney(order.totalLotCostVnd)} ₫</strong></span>
                  <span><span className="muted-copy">Cọc:</span> <strong>{formatMoney(order.depositVnd)} ₫</strong></span>
                  <span><span className="muted-copy">Còn lại:</span> <strong className="money">{formatMoney(order.remainingPaymentVnd)} ₫</strong></span>
                </div>
              </div>
            )) : <p>Đang tải thông tin đơn hàng...</p>}

            {orders.length > 1 && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#f1f5f9', borderRadius: 8, display: 'flex', gap: 32, fontSize: 14 }}>
                <span><span className="muted-copy">Tổng tiền lô:</span> <strong>{formatMoney(orders.reduce((s, o) => s + Number(o.totalLotCostVnd || 0), 0))} ₫</strong></span>
                <span><span className="muted-copy">Tổng cọc:</span> <strong>{formatMoney(orders.reduce((s, o) => s + Number(o.depositVnd || 0), 0))} ₫</strong></span>
                <span><span className="muted-copy">Tổng còn lại:</span> <strong className="money">{formatMoney(orders.reduce((s, o) => s + Number(o.remainingPaymentVnd || 0), 0))} ₫</strong></span>
              </div>
            )}
          </section>

          {(exchangeRateDiff > 0 || additionalShipping > 0 || customFees.length > 0) && (
            <section className="detail-section" style={{ marginTop: 20 }}>
              <h3>Chi phí phát sinh</h3>
              <div className="table-card" style={{ marginTop: 8 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Loại chi phí</th>
                      <th>Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeRateDiff > 0 && (
                      <tr><td>Phí chênh lệch tỷ giá</td><td className="money">{exchangeRateDiff.toLocaleString('vi-VN')} ₫</td></tr>
                    )}
                    {additionalShipping > 0 && (
                      <tr><td>Phí vận chuyển bổ sung</td><td className="money">{additionalShipping.toLocaleString('vi-VN')} ₫</td></tr>
                    )}
                    {customFees.map((fee, idx) => (
                      <tr key={idx}><td>{fee.feeName}</td><td className="money">{Number(fee.feeAmount || 0).toLocaleString('vi-VN')} ₫</td></tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f9fafb' }}>
                      <td>Tổng chi phí bổ sung</td>
                      <td className="money">{totalExtra.toLocaleString('vi-VN')} ₫</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(Number(request.amountVnd) || 0) > 0 && (
            <section className="detail-section" style={{ marginTop: 20, background: '#f8fafc', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span>Tiền đề nghị:</span>
                <strong>{Number(request.amountVnd).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginTop: 6 }}>
                <span>Phí phát sinh:</span>
                <strong>{totalExtra.toLocaleString('vi-VN')} ₫</strong>
              </div>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700 }}>
                <span>Tổng thanh toán:</span>
                <span className="money">{(Number(request.amountVnd || 0) + totalExtra).toLocaleString('vi-VN')} ₫</span>
              </div>
            </section>
          )}

        {waybills.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Vận đơn liên quan</h3>
            <div className="table-card" style={{ marginTop: 8 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã vận đơn</th>
                    <th>Đơn vị vận chuyển</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((wb) => (
                    <tr key={wb.id}>
                      <td><a href={`/waybills/${wb.id}`} className="link">{wb.waybillCode}</a></td>
                      <td>{wb.carrier || '-'}</td>
                      <td>{wb.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {warehouseReceipts.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Phiếu nhận hàng & Kiểm đếm ({warehouseReceipts.length})</h3>
            <div className="table-card" style={{ marginTop: 8 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Vận đơn</th>
                    <th>Số lượng nhận</th>
                    <th>Số lượng dự kiến</th>
                    <th>Ngày nhận</th>
                    <th>Người kiểm</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseReceipts.map((r) => (
                    <tr key={r.id}>
                      <td><a href={`/warehouse/receipts/${r.id}`} className="link">#{r.id}</a></td>
                      <td>{r.waybillCode || '-'}</td>
                      <td>{r.receivedQty ?? '-'}</td>
                      <td>{r.expectedQty ?? '-'}</td>
                      <td>{r.receivedDate ? new Date(r.receivedDate).toLocaleDateString('vi-VN') : '-'}</td>
                      <td>{r.inspector || '-'}</td>
                      <td>{r.goodsCondition || '-'}</td>
                      <td><span className={`badge badge-${(r.status || '').toLowerCase()}`}>{r.status || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {request.accountingCheckedAt && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Kế toán duyệt chi</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Thời gian duyệt chi</span><span className="value">{new Date(request.accountingCheckedAt).toLocaleString('vi-VN')}</span></div>
              {request.accountingCheckedBy && (
                <div className="info-row"><span className="label">Người duyệt chi</span><span className="value">{request.accountingCheckedBy}</span></div>
              )}
            </div>
          </section>
        )}

        {request.paymentConfirmedAt && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Xác nhận thanh toán</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Thời gian xác nhận</span><span className="value">{new Date(request.paymentConfirmedAt).toLocaleString('vi-VN')}</span></div>
              {request.paymentConfirmedBy && (
                <div className="info-row"><span className="label">Người xác nhận</span><span className="value">{request.paymentConfirmedBy}</span></div>
              )}
            </div>
          </section>
        )}

        {bankAccountInfo && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Thông tin chuyển khoản</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Số tài khoản</span><span className="value">{bankAccountInfo.accountNumber}</span></div>
              <div className="info-row"><span className="label">Chủ tài khoản</span><span className="value">{bankAccountInfo.accountHolder}</span></div>
              <div className="info-row"><span className="label">Ngân hàng</span><span className="value">{bankAccountInfo.bankName}</span></div>
              {bankAccountInfo.qrCode && (
                <div className="info-row">
                  <span className="label">Mã QR</span>
                  <span className="value">
                    <img src={resolveFileUrl(bankAccountInfo.qrCode)} alt="QR" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8 }} />
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="alert" style={{ marginTop: '20px' }}>
          <div className="muted-copy">
            <strong>Luồng phê duyệt:</strong> Lập đề nghị → Trưởng phòng duyệt (L1) → Kế toán duyệt chi → Admin/Giám đốc duyệt (L2) → Kế toán thanh toán.
          </div>
        </div>

        {/* Printable View Section */}
        {request && (
          <div className="printable-view" style={{ marginTop: '24px', padding: '24px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ width: 64, height: 64, background: '#1e3a5f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>LOGO<br/>CÔNG TY</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, textTransform: 'uppercase' }}>ĐỀ NGHỊ THANH TOÁN</h2>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#64748b' }}>Số: {formatDnttCode(request.id)} · Ngày: {new Date(request.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <hr style={{ margin: '12px 0', border: 'none', borderTop: '2px solid #1e3a5f' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, marginBottom: 12 }}>
              <div><strong>Người đề nghị:</strong> {request.createdBy || '-'}</div>
              <div><strong>Phòng ban / Bộ phận:</strong> {request.department || '-'}</div>
              <div><strong>Loại thanh toán:</strong> {request.paperType === 'HOAN_UNG' ? 'Hoàn ứng' : 'Thanh toán'}</div>
              <div><strong>Loại phiếu:</strong> {getPaymentTypeLabel(request.type)}</div>
            </div>

            {orders.length > 0 && (
              <>
                <h4 style={{ margin: '16px 0 8px 0', color: '#334155' }}>Đơn hàng liên quan</h4>
                {orders.map((order) => (
                  <div key={order.id} style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 4 }}>
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
                              <td style={{ padding: '2px' }}>{item.productName || productMap[item.posCode] || '-'}</td>
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
                                    </td>
                                    <td style={{ fontSize: 9, color: '#64748b' }}>{v.name}</td>
                                    <td style={{ textAlign: 'center', fontSize: 11 }}>{v.qty || 0}</td>
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
              </>
            )}

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />

            <div style={{ fontSize: 14, marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', width: '40%', fontWeight: 600 }}>1. Số tiền tạm ứng (nếu có):</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(request.advanceAmountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                    <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13 }}>{numberToWords(Number(request.advanceAmountVnd || 0))} đồng</td>
                  </tr>
                  <tr style={{ borderTop: '1px dashed #94a3b8' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>2. Số tiền đã chi:</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(request.amountSpentVnd || 0).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                    <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13 }}>{numberToWords(Number(request.amountSpentVnd || 0))} đồng</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1e3a5f' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: '#1e3a5f' }}>3. Đề nghị thanh toán số tiền:</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1e3a5f' }}>{Number(request.amountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                    <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13, fontWeight: 600 }}>{numberToWords(Number(request.amountVnd || 0))} đồng</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {totalExtra > 0 && (
              <div style={{ marginTop: 12, padding: 10, background: '#f1f5f9', borderRadius: 4, fontSize: 13 }}>
                <p style={{ fontWeight: 600, margin: '0 0 6px 0' }}>Chi phí bổ sung:</p>
                {exchangeRateDiff > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Chênh lệch tỷ giá</span><span>+ {exchangeRateDiff.toLocaleString('vi-VN')} ₫</span></div>}
                {additionalShipping > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phí VC bổ sung</span><span>+ {additionalShipping.toLocaleString('vi-VN')} ₫</span></div>}
                {customFees.filter(f => f.feeName && Number(f.feeAmount) > 0).map((fee, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{fee.feeName}</span><span>+ {Number(fee.feeAmount).toLocaleString('vi-VN')} ₫</span></div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 14 }}>
              <p><strong>Lý do thanh toán:</strong></p>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{request.reason || request.note || '(Không có)'}</p>
            </div>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center', fontSize: 13 }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Người đề nghị</p>
                <p style={{ marginTop: 40 }}>_________________________<br/>{request.createdBy || '-'}</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Kế toán trưởng</p>
                <p style={{ marginTop: 40 }}>_________________________<br/>(Ký, họ tên)</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Giám đốc</p>
                <p style={{ marginTop: 40 }}>_________________________<br/>(Ký, họ tên)</p>
              </div>
            </div>
          </div>
        )}

      {showRejectModal ? (
        <div className="modal-overlay" onClick={() => { if (!rejecting) setShowRejectModal(false); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Xác nhận từ chối</h3>
            <div className="form-group">
              <label>Vấn đề *</label>
              <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)} disabled={rejecting}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}>
                <option value="">-- Chọn vấn đề --</option>
                {REJECT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Chi tiết lý do</label>
              <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} disabled={rejecting}
                placeholder="Nhập chi tiết lý do từ chối..."
                rows={4}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical' }} />
            </div>
            <div className="form-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={rejecting}>Hủy</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={rejecting || !rejectCategory}>
                {rejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPayModal ? (
        <div className="modal-overlay" onClick={() => { if (!paying) setShowPayModal(false); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 16 }}>Xác nhận đã thanh toán</h3>

            <div className="form-group">
              <label>Người thực hiện chuyển khoản *</label>
              <input type="text" value={payConfirmedBy} onChange={e => setPayConfirmedBy(e.target.value)}
                placeholder="Nhập họ tên người chuyển khoản" disabled={paying} />
            </div>

            <div className="form-group">
              <label>Tài khoản thụ hưởng</label>
              <select value={selectedBankAccountId} onChange={e => {
                setSelectedBankAccountId(e.target.value);
                if (e.target.value === '__NEW__') {
                  setShowNewBankAccount(true);
                  setSelectedBankAccountId('');
                } else {
                  setShowNewBankAccount(false);
                }
              }} disabled={paying}>
                <option value="">-- Chọn tài khoản có sẵn --</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountNumber} ({acc.accountHolder})
                  </option>
                ))}
                <option value="__NEW__">+ Thêm tài khoản mới</option>
              </select>
            </div>

            {selectedBankAccountId && (() => {
              const selected = bankAccounts.find(a => String(a.id) === selectedBankAccountId);
              return selected && selected.qrCode ? (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <img src={resolveFileUrl(selected.qrCode)} alt="QR"
                    style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8 }} />
                </div>
              ) : null;
            })()}

            {showNewBankAccount && (
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, background: '#f8fafc' }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Thông tin tài khoản mới</p>
                <div className="form-group">
                  <label>Số tài khoản *</label>
                  <input type="text" value={newBankAccount.accountNumber}
                    onChange={e => setNewBankAccount(p => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="Nhập số tài khoản" disabled={paying} />
                </div>
                <div className="form-group">
                  <label>Tên chủ tài khoản *</label>
                  <input type="text" value={newBankAccount.accountHolder}
                    onChange={e => setNewBankAccount(p => ({ ...p, accountHolder: e.target.value }))}
                    placeholder="Nhập tên chủ tài khoản" disabled={paying} />
                </div>
                <div className="form-group">
                  <label>Tên ngân hàng *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={newBankAccount.bankName}
                      onChange={e => setNewBankAccount(p => ({ ...p, bankName: e.target.value }))}
                      disabled={paying} style={{ flex: 1 }}>
                      <option value="">-- Chọn ngân hàng --</option>
                      {bankNames.map(n => (
                        <option key={n.id} value={n.bankName}>{n.bankName}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddBankName(true)}
                      disabled={paying} title="Thêm tên ngân hàng mới">+</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Mã QR (tùy chọn)</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setNewBankAccountQrFile(file);
                  }} disabled={paying} />
                </div>
              </div>
            )}

            {showAddBankName && (
              <div className="modal-overlay" onClick={() => setShowAddBankName(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
                  <h3 style={{ marginBottom: 16 }}>Thêm tên ngân hàng mới</h3>
                  <div className="form-group">
                    <label>Tên ngân hàng</label>
                    <input type="text" value={newBankNameInput}
                      onChange={e => setNewBankNameInput(e.target.value)}
                      placeholder="Nhập tên ngân hàng" />
                  </div>
                  <div className="form-actions" style={{ marginTop: 20 }}>
                    <button className="btn btn-secondary" onClick={() => { setShowAddBankName(false); setNewBankNameInput(''); }}>Hủy</button>
                    <button className="btn btn-primary" onClick={async () => {
                      if (!newBankNameInput.trim()) { alert('Vui lòng nhập tên ngân hàng'); return; }
                      try {
                        await bankAccountAPI.addBankName({ bankName: newBankNameInput.trim() });
                        const updated = await bankAccountAPI.getBankNames();
                        setBankNames(updated);
                        setNewBankAccount(p => ({ ...p, bankName: newBankNameInput.trim() }));
                        setShowAddBankName(false);
                        setNewBankNameInput('');
                      } catch (err) {
                        alert('Lỗi: ' + err.message);
                      }
                    }}>Thêm</button>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>File ủy nhiệm chi / bằng chứng chuyển khoản</label>
              <input type="file" multiple accept="image/*,.pdf" onChange={e => setPayFiles(Array.from(e.target.files || []))} disabled={paying} />
              {payFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {payFiles.map((f, idx) => (
                    <span key={idx} style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 4 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Chia sẻ ảnh / file đính kèm cho DNTT khác</label>
              <p className="muted-copy" style={{ fontSize: 12, marginBottom: 6 }}>
                {paymentList.length > 0
                  ? 'Click chọn các DNTT muốn bổ sung file (để trống nếu không muốn chia sẻ):'
                  : 'Không có đề nghị thanh toán nào khác để chia sẻ.'}
              </p>
              {paymentList.length > 0 && (
                <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, padding: 6 }}>
                  {paymentList.map(p => (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                      borderRadius: 4, cursor: 'pointer', fontSize: 13,
                      background: selectedOtherDnttIds.includes(String(p.id)) ? '#eff6ff' : 'transparent'
                    }}>
                      <input type="checkbox" checked={selectedOtherDnttIds.includes(String(p.id))}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedOtherDnttIds(prev => [...prev, String(p.id)]);
                          } else {
                            setSelectedOtherDnttIds(prev => prev.filter(v => v !== String(p.id)));
                          }
                        }}
                        disabled={paying} />
                      <span style={{ fontWeight: 500 }}>{formatDnttCode(p.id)}</span>
                      <span className="muted-copy" style={{ fontSize: 12 }}>{getPaymentTypeLabel(p.type)}</span>
                      <button type="button" title="Xem chi tiết DNTT"
                        onClick={(e) => { e.preventDefault(); openQuickViewDntt(p.id); }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        👁️
                      </button>
                    </label>
                  ))}
                </div>
              )}
              {selectedOtherDnttIds.length > 0 && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                  ✓ File sẽ được sao chép vào {selectedOtherDnttIds.length} DNTT đã chọn
                </p>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)} disabled={paying}>Hủy</button>
              <button className="btn btn-primary" onClick={handlePay} disabled={paying || !payConfirmedBy.trim()}>
                {paying ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quickViewDntt && (
        <div className="modal-overlay" onClick={closeQuickViewDntt}>
          <div className="modal-card-detail" onClick={e => e.stopPropagation()}
            style={{ width: 'min(800px, 95vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>{formatDnttCode(quickViewDntt.id)}</h2>
              <button onClick={closeQuickViewDntt} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b', padding: '4px 8px', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
              {quickViewDnttLoading ? (
                <p>Đang tải...</p>
              ) : (
                <>
                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="info-list">
                      <div className="info-row"><span className="label">Loại thanh toán</span><span className="value">{getPaymentTypeLabel(quickViewDntt.type)}</span></div>
                      <div className="info-row"><span className="label">Số tiền</span><span className="value money">{Number(quickViewDntt.amountVnd || 0).toLocaleString('vi-VN')} ₫</span></div>
                      <div className="info-row"><span className="label">Trạng thái</span><span className={`badge ${getPaymentStatusBadgeClass(quickViewDntt.status)}`}>{getPaymentStatusLabel(quickViewDntt.status)}</span></div>
                    </div>
                    <div className="info-list">
                      <div className="info-row"><span className="label">Người tạo</span><span className="value">{quickViewDntt.createdBy || '-'}</span></div>
                      <div className="info-row"><span className="label">Ngày tạo</span><span className="value">{new Date(quickViewDntt.createdAt).toLocaleString('vi-VN')}</span></div>
                      <div className="info-row"><span className="label">PO</span><span className="value">{quickViewDntt.poIds ? quickViewDntt.poIds.map(id => formatPoCode(id)).join(', ') : '-'}</span></div>
                    </div>
                  </div>
                  {quickViewDntt.reason && (
                    <p style={{ fontSize: 13, marginBottom: 12 }}><strong>Lý do:</strong> {quickViewDntt.reason}</p>
                  )}
                  {quickViewDnttOrders.length > 0 && (
                    <section>
                      <h4 style={{ fontSize: 14, marginBottom: 8, color: '#334155' }}>Đơn hàng liên quan</h4>
                      {quickViewDnttOrders.map((order) => (
                        <div key={order.id} style={{ marginBottom: 10, padding: 8, border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: '#2563eb' }}>{order.poCode || 'PO-' + order.id}</div>
                          {order.items && order.items.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  <th style={{ padding: '2px' }}>SP</th>
                                  <th style={{ padding: '2px', textAlign: 'center', width: 30 }}>SL</th>
                                  <th style={{ padding: '2px', textAlign: 'right' }}>Đơn giá</th>
                                  <th style={{ padding: '2px', textAlign: 'right' }}>Thành tiền</th>
                                  <th style={{ padding: '2px', textAlign: 'center', width: 30 }}>TG</th>
                                  <th style={{ padding: '2px', textAlign: 'right' }}>VNĐ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => {
                                  const subForeign = Number(item.unitPrice || 0) * Number(item.orderedQty || 0);
                                  const rate = Number(item.exchangeRate || 0);
                                  const subVnd = Math.round(subForeign * (rate || 1));
                                  return (
                                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '2px' }}>{item.productName || '-'}</td>
                                      <td style={{ padding: '2px', textAlign: 'center' }}>{item.orderedQty ?? '-'}</td>
                                      <td style={{ padding: '2px', textAlign: 'right' }}>{Number(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
                                      <td style={{ padding: '2px', textAlign: 'right' }}>{subForeign.toLocaleString('vi-VN')}</td>
                                      <td style={{ padding: '2px', textAlign: 'center', fontSize: 9, color: '#64748b' }}>{rate > 0 ? rate.toLocaleString('vi-VN') : '-'}</td>
                                      <td style={{ padding: '2px', textAlign: 'right' }}>{subVnd.toLocaleString('vi-VN')} ₫</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                  {(() => {
                    const urls = parseAttachmentUrls(quickViewDntt.attachments);
                    return urls.length > 0 ? (
                      <section style={{ marginTop: 12 }}>
                        <h4 style={{ fontSize: 14, marginBottom: 8, color: '#334155' }}>Minh chứng</h4>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {urls.map((url) => {
                            const fullUrl = resolveFileUrl(url);
                            const name = getAttachmentFileName(url);
                            const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
                            return (
                              <div key={url} style={{ width: 64, height: 64, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {isImage ? (
                                  <a href={fullUrl} target="_blank" rel="noreferrer"><img src={fullUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></a>
                                ) : (
                                  <a href={fullUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 10, color: '#2563eb', padding: 2, textAlign: 'center' }}>{name}</a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentRequestDetail;
