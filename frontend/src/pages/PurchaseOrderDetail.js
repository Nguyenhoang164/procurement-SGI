import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { purchaseOrderAPI, costCommentAPI, productAPI, productCostAPI } from '../services/api';
import { canCreatePaymentForOrder, getPaymentStatusBadgeClass, getPaymentStatusLabel } from '../utils/paymentUtils';
import { isAdmin, canEditPO, canApprovePO_L1, canRejectPO, canAddCostComment, canSendPOToAccounting, hasRole, ROLES } from '../utils/permissions';

function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentForm, setCommentForm] = useState({ expectedCostVnd: '', actualCostVnd: '', content: '', createdBy: '' });
  const [productMap, setProductMap] = useState({});
  const [costMap, setCostMap] = useState({});
  const [editCosts, setEditCosts] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCategory, setRejectCategory] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [savingCosts, setSavingCosts] = useState(false);
  const [costForm, setCostForm] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await purchaseOrderAPI.getById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await costCommentAPI.getByPoId(id);
      setComments(data);
    } catch {}
  }, [id]);

  useEffect(() => { fetchOrder(); fetchComments(); }, [fetchOrder, fetchComments]);

  useEffect(() => {
    productAPI.getAll().then(products => {
      const map = {};
      products.forEach(p => { if (p.posCode) map[p.posCode] = p.productName; });
      setProductMap(map);
    }).catch(() => {});
    productCostAPI.getAll().then(costs => {
      const map = {};
      costs.forEach(c => { if (c.posCode) map[c.posCode] = c; });
      setCostMap(map);
    }).catch(() => {});
  }, []);

  const getName = (item) => item.productName || productMap[item.posCode] || '-';

  const startEditCosts = () => {
    setCostForm({
      domesticShippingVnd: order.domesticShippingVnd ?? '0',
      intlShippingVnd: order.intlShippingVnd ?? '0',
      orderFeeVnd: order.orderFeeVnd ?? '0',
      localDeliveryFeeVnd: order.localDeliveryFeeVnd ?? '0',
      totalLotCostVnd: order.totalLotCostVnd ?? '0',
      depositVnd: order.depositVnd ?? '0'
    });
    setEditCosts(true);
  };

  const handleCostChange = (field, value) => {
    setCostForm(prev => ({ ...prev, [field]: value }));
  };

  const saveCosts = async () => {
    setSavingCosts(true);
    try {
      const payload = {
        domesticShippingVnd: Number(costForm.domesticShippingVnd) || 0,
        intlShippingVnd: Number(costForm.intlShippingVnd) || 0,
        orderFeeVnd: Number(costForm.orderFeeVnd) || 0,
        localDeliveryFeeVnd: Number(costForm.localDeliveryFeeVnd) || 0,
        totalLotCostVnd: Number(costForm.totalLotCostVnd) || 0,
        depositVnd: Number(costForm.depositVnd) || 0,
        sourcePlanId: order.sourcePlanId || null
      };
      await purchaseOrderAPI.update(id, payload);
      setEditCosts(false);
      fetchOrder();
    } catch (err) {
      alert("Lỗi cập nhật chi phí: " + err.message);
    } finally { setSavingCosts(false); }
  };

  const cancelEditCosts = () => {
    setEditCosts(false);
    setCostForm({});
  };

  const handleApproveL1 = async () => {
    try { await purchaseOrderAPI.approveL1(id); fetchOrder(); }
    catch (err) { alert("Lỗi phê duyệt: " + err.message); }
  };

  const REJECT_CATEGORIES = [
    { value: 'Sai thông tin', label: 'Sai thông tin' },
    { value: 'Thiếu chứng từ', label: 'Thiếu chứng từ' },
    { value: 'Sai số tiền', label: 'Sai số tiền' },
    { value: 'Chưa đủ điều kiện', label: 'Chưa đủ điều kiện' },
    { value: 'Khác', label: 'Khác' },
  ];

  const openRejectModal = () => {
    setRejectCategory('');
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const reason = rejectCategory + (rejectComment ? `: ${rejectComment}` : '');
      await purchaseOrderAPI.reject(id, reason, user?.username);
      setShowRejectModal(false);
      fetchOrder();
    } catch (err) {
      alert("Lỗi từ chối: " + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await costCommentAPI.create({
        poId: Number(id),
        expectedCostVnd: Number(commentForm.expectedCostVnd) || 0,
        actualCostVnd: Number(commentForm.actualCostVnd) || 0,
        content: commentForm.content,
        type: 'COST_VARIANCE',
        createdBy: commentForm.createdBy || user?.username
      });
      setShowCommentForm(false);
      setCommentForm({ expectedCostVnd: '', actualCostVnd: '', content: '', createdBy: '' });
      fetchComments();
    } catch (err) { alert("Lỗi: " + err.message); }
  };

  const stepState = useMemo(() => {
    const status = order?.status || 'PENDING_L1';
    if (status === 'COMPLETED') return ['done', 'done', 'done', 'done'];
    if (status === 'IN_TRANSIT') return ['done', 'done', 'active', 'wait'];
    if (status === 'SHIPPING') return ['done', 'done', 'active', 'wait'];
    if (status === 'APPROVED') return ['done', 'active', 'wait', 'wait'];
    if (status === 'REJECTED') return ['rejected', 'wait', 'wait', 'wait'];
    if (status === 'DRAFT') return ['wait', 'wait', 'wait', 'wait'];
    return ['active', 'wait', 'wait', 'wait'];
  }, [order]);

  if (loading) return <div className="page-content"><div className="loading">Đang tải...</div></div>;
  if (error) return <div className="page-content"><div className="error-message">{error}</div></div>;
  if (!order) return <div className="page-content"><div className="error-message">Không tìm thấy đơn hàng.</div></div>;

  const isAdminUser = isAdmin(user);
  const isSalesOrManager = hasRole(user, ROLES.SALES, ROLES.SALES_MANAGER);
  const canAddComment = canAddCostComment(user);
  const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';
  const formatMoney = (value) => value != null ? Number(value).toLocaleString('vi-VN') : '0';
  const formatPlanCode = (planId) => planId ? `KH-${String(planId).padStart(4, '0')}` : '-';

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Chi tiết đơn hàng — {order.poCode || 'PO-' + order.id}</h1>
          <p className="page-subtitle">Theo dõi tiến trình: Chờ duyệt → Phê duyệt → Vận chuyển → Hoàn tất</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>Quay lại</button>

          {order.status === 'PENDING_L1' && (canApprovePO_L1(user) || canRejectPO(user)) && (
            <>
              {canRejectPO(user) && (
                <button className="btn btn-danger" onClick={openRejectModal}>Từ chối</button>
              )}
              {canApprovePO_L1(user) && (
                <button className="btn btn-primary" onClick={handleApproveL1}>Phê duyệt</button>
              )}
            </>
          )}

          {canEditPO(user) && (
            <button className="btn btn-secondary" onClick={() => navigate(`/purchase-orders/edit/${id}`)}>Chỉnh sửa</button>
          )}
          {canCreatePaymentForOrder(user, order) ? (
            <button className="btn btn-primary" onClick={() => navigate(`/payments/new?poId=${id}`)}>Lập DNTT</button>
          ) : null}
        </div>
      </div>

      <div className="page-content">
        <div className="progress-card">
          <div className="progress-steps">
              {[
                { label: 'Chờ duyệt', icon: null },
                { label: 'Phê duyệt', icon: null },
                { label: 'Vận chuyển', icon: null },
                { label: 'Hoàn tất', icon: null }
              ].map((step, index) => (
              <React.Fragment key={step.label}>
                <div className={`progress-step ${stepState[index]}`}>
                  <div className="progress-dot">
                    {stepState[index] === 'done' ? (
                      <span style={{ fontSize: 16, lineHeight: 1 }}>✓</span>
                    ) : stepState[index] === 'rejected' ? (
                      <span style={{ fontSize: 16, lineHeight: 1 }}>✕</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="progress-label">{step.label}</div>
                </div>
                {index < 3 ? <div className="progress-line" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        {order.status === 'REJECTED' && (
          <section className="detail-section" style={{ borderLeft: '4px solid #dc2626', marginTop: 16 }}>
            <h3 style={{ color: '#dc2626' }}>Đã từ chối</h3>
            <div className="info-list">
              {order.rejectedBy && (
                <div className="info-row"><span className="label">Người từ chối</span><span className="value">{order.rejectedBy}</span></div>
              )}
              {order.rejectedAt && (
                <div className="info-row"><span className="label">Thời gian</span><span className="value">{new Date(order.rejectedAt).toLocaleString('vi-VN')}</span></div>
              )}
              {order.rejectReason && (
                <div className="info-row"><span className="label">Lý do</span><span className="value" style={{ color: '#dc2626', fontStyle: 'italic' }}>{order.rejectReason}</span></div>
              )}
            </div>
          </section>
        )}

        <div className="detail-grid">
          <section className="detail-section">
            <h3>Thông tin chung</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Mã PO</span><span className="value">{order.poCode || 'PO-' + order.id}</span></div>
              <div className="info-row">
                <span className="label">Mã kế hoạch nhập</span>
                <span className="value">
                  {order.sourcePlanId ? (
                    <a href={`/weekly-plans?search=${encodeURIComponent(formatPlanCode(order.sourcePlanId))}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/weekly-plans', { state: { search: formatPlanCode(order.sourcePlanId) } });
                      }}
                      style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                      {formatPlanCode(order.sourcePlanId)}
                    </a>
                  ) : '-'}
                </span>
              </div>
              <div className="info-row"><span className="label">Nhà cung cấp</span><span className="value">{order.supplierName || '-'}</span></div>
              {order.landing && (
                <div className="info-row">
                  <span className="label">Landing page</span>
                  <span className="value"><a href={order.landing} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{order.landing}</a></span>
                </div>
              )}
              <div className="info-row"><span className="label">Số sản phẩm</span><span className="value">{order.items ? order.items.length : 0}</span></div>
              <div className="info-row"><span className="label">Trạng thái</span><span className={`badge badge-${order.status?.toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span></div>
              <div className="info-row">
                <span className="label">Thanh toán</span>
                <span className={`badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                  {getPaymentStatusLabel(order.paymentStatus) || '—'}
                </span>
              </div>
              {order.goodsPaymentDate && (
                <div className="info-row"><span className="label">Ngày TT tiền hàng</span><span className="value">{order.goodsPaymentDate}</span></div>
              )}
              {order.expectedWarehouseArrivalDate && (
                <div className="info-row"><span className="label">Ngày nhận hàng</span><span className="value">{order.expectedWarehouseArrivalDate}</span></div>
              )}
            </div>
          </section>

          <section className="detail-section highlight">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Tổng hợp chi phí</h3>
              {!editCosts && (
                <button className="btn btn-sm btn-secondary" onClick={startEditCosts}>Sửa chi phí</button>
              )}
              {editCosts && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-secondary" onClick={cancelEditCosts} disabled={savingCosts}>Hủy</button>
                  <button className="btn btn-sm btn-primary" onClick={saveCosts} disabled={savingCosts}>
                    {savingCosts ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              )}
            </div>
            {!editCosts ? (
            <div className="info-list">
              <div className="info-row"><span className="label">Tiền hàng</span><span className="value money">{formatMoney(order.totalGoodsCostVnd)} ₫</span></div>
              <div className="info-row"><span className="label">VC nội địa</span><span className="value">{formatMoney(order.domesticShippingVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Cước VC QT</span><span className="value">{formatMoney(order.intlShippingVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Phí đặt hàng</span><span className="value">{formatMoney(order.orderFeeVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Phí ship nội địa</span><span className="value">{formatMoney(order.localDeliveryFeeVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Tổng tiền lô</span><span className="value money">{formatMoney(order.totalLotCostVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Giá vốn / 1 SP</span><span className="value money">{formatMoney(order.unitCostFullVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Đã đặt cọc</span><span className="value">{formatMoney(order.depositVnd)} ₫</span></div>
              <div className="info-row"><span className="label">Còn lại</span><span className="value money">{formatMoney(order.remainingPaymentVnd)} ₫</span></div>
            </div>
            ) : (
            <div className="info-list">
              <div className="info-row"><span className="label">Tiền hàng</span><span className="value money">{formatMoney(order.totalGoodsCostVnd)} ₫</span></div>
              <div className="info-row">
                <span className="label">VC nội địa</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  value={costForm.domesticShippingVnd} onChange={e => handleCostChange('domesticShippingVnd', e.target.value)} />
              </div>
              <div className="info-row">
                <span className="label">Cước VC QT</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  value={costForm.intlShippingVnd} onChange={e => handleCostChange('intlShippingVnd', e.target.value)} />
              </div>
              <div className="info-row">
                <span className="label">Phí đặt hàng</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  value={costForm.orderFeeVnd} onChange={e => handleCostChange('orderFeeVnd', e.target.value)} />
              </div>
              <div className="info-row">
                <span className="label">Phí ship nội địa</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  value={costForm.localDeliveryFeeVnd} onChange={e => handleCostChange('localDeliveryFeeVnd', e.target.value)} />
              </div>
              <div className="info-row">
                <span className="label">Tổng tiền lô</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 600 }}
                  value={costForm.totalLotCostVnd} onChange={e => handleCostChange('totalLotCostVnd', e.target.value)} />
              </div>
              <div className="info-row"><span className="label">Giá vốn / 1 SP</span><span className="value money">{formatMoney(order.unitCostFullVnd)} ₫</span></div>
              <div className="info-row">
                <span className="label">Đã đặt cọc</span>
                <input type="number" style={{ width: 160, textAlign: 'right', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  value={costForm.depositVnd} onChange={e => handleCostChange('depositVnd', e.target.value)} />
              </div>
              <div className="info-row"><span className="label">Còn lại</span><span className="value money">{formatMoney(order.remainingPaymentVnd)} ₫</span></div>
            </div>
            )}
          </section>
        </div>

        {order.items && order.items.length > 0 && (
          <section className="detail-section" style={{ marginTop: 20 }}>
            <h3>Danh sách sản phẩm ({order.items.length})</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Tên SP</th>
                    <th style={{ width: 110 }}>Mã POS</th>
                    <th style={{ width: 60 }}>SL</th>
                    <th style={{ width: 100 }}>Chi tiết</th>
                    <th style={{ width: 110 }}>Đơn giá (NT)</th>
                    <th style={{ width: 70 }}>TG</th>
                    <th style={{ width: 110 }}>Hình thức VC</th>
                    <th style={{ width: 100 }}>Tiền NT</th>
                    <th style={{ width: 100 }}>Tiền VND</th>
                    <th style={{ width: 100 }}>Giá vốn TB</th>
                    <th style={{ width: 100 }}>Giá vốn gần nhất</th>
                    <th style={{ width: 120 }}>Chênh lệch GV</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.flatMap((item, idx) => {
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
                        <td>{getName(item)}</td>
                        <td>
                          <a href="#"
                            onClick={(e) => { e.preventDefault(); navigate('/products', { state: { search: item.posCode } }); }}
                            style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                            {item.posCode}
                          </a>
                        </td>
                        <td>{item.orderedQty}</td>
                        <td style={{ fontSize: 13, color: '#475569', maxWidth: 120 }}>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                        <td>{Number(item.unitPrice || 0).toLocaleString()} {item.currency}</td>
                        <td>{item.exchangeRate ? Number(item.exchangeRate).toLocaleString() : '-'}</td>
                        <td>{item.shippingMethod || order.shippingMethod || '-'}</td>
                        <td className="money">{Number(item.totalAmountForeign || 0).toLocaleString()} {item.currency}</td>
                        <td className="money">{Number(item.totalAmountVnd || 0).toLocaleString()} đ</td>
                        <td className="money">
                          {item.posCode && costMap[item.posCode]?.weightedAvgCostVnd
                            ? Number(costMap[item.posCode].weightedAvgCostVnd).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                        <td className="money">
                          {item.posCode && costMap[item.posCode]?.latestUnitCostVnd ? (
                            <span style={{ fontSize: 12 }}>
                              {Number(costMap[item.posCode].latestUnitCostVnd).toLocaleString('vi-VN')} {costMap[item.posCode].latestCurrency || '₫'}
                              {costMap[item.posCode].latestOrderCode && (
                                <><br/><span style={{ color: '#64748b', fontSize: 11 }}>
                                  {costMap[item.posCode].latestOrderCode}
                                </span></>
                              )}
                              {costMap[item.posCode].latestCostDate && (
                                <><br/><span style={{ color: '#94a3b8', fontSize: 10 }}>
                                  {new Date(costMap[item.posCode].latestCostDate).toLocaleDateString('vi-VN')}
                                </span></>
                              )}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {(() => {
                            if (!item.posCode) return <span className="muted-copy">—</span>;
                            const prevCost = costMap[item.posCode]?.weightedAvgCostVnd;
                            if (prevCost == null || Number(prevCost) === 0) return <span className="muted-copy">Mới</span>;
                            const qty = Number(item.orderedQty) || 1;
                            const perUnitVnd = Number(item.totalAmountVnd || 0) / qty;
                            const diff = perUnitVnd - Number(prevCost);
                            const pct = (diff / Number(prevCost)) * 100;
                            const color = Math.abs(pct) < 5 ? '#16a34a' : pct > 0 ? '#dc2626' : '#2563eb';
                            return <span style={{ color, fontWeight: 600, fontSize: 13 }}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>;
                          })()}
                        </td>
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
                            <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
                            <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
          </section>
        )}

        <section className="detail-section" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Phân hệ tương tác Kế toán — Chênh lệch giá vốn</h3>
            {canAddComment && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowCommentForm(!showCommentForm)}>
                {showCommentForm ? 'Đóng' : 'Thêm cảnh báo'}
              </button>
            )}
          </div>

          {showCommentForm && (
            <form className="app-form" onSubmit={handleAddComment} style={{ marginBottom: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá vốn dự kiến (VND)</label>
                  <input type="number" value={commentForm.expectedCostVnd} onChange={(e) => setCommentForm(f => ({ ...f, expectedCostVnd: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Giá vốn thực tế (VND)</label>
                  <input type="number" value={commentForm.actualCostVnd} onChange={(e) => setCommentForm(f => ({ ...f, actualCostVnd: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Nội dung cảnh báo</label>
                <textarea value={commentForm.content} onChange={(e) => setCommentForm(f => ({ ...f, content: e.target.value }))} rows={3} required />
              </div>
              <button type="submit" className="btn btn-primary">Gửi cảnh báo</button>
            </form>
          )}

          {comments.length === 0 ? (
            <p className="muted-copy">Chưa có cảnh báo chênh lệch giá vốn.</p>
          ) : (
            <div className="comment-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-card" style={{ padding: 12, marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fefce8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{c.createdBy || 'Kế toán'}</strong>
                    <span className="muted-copy">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {c.varianceAmountVnd != null && (
                    <div style={{ color: Number(c.varianceAmountVnd) > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      Chênh lệch: {formatMoney(c.varianceAmountVnd)} ₫
                    </div>
                  )}
                  <p style={{ margin: '4px 0' }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showRejectModal ? (
        <div className="modal-overlay" onClick={() => { if (!rejecting) setShowRejectModal(false); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Xác nhận từ chối đơn hàng</h3>
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
    </div>
  );
}

function getOrderStatusLabel(status) {
  const labels = {
    DRAFT: 'Nháp', PENDING_L1: 'Chờ duyệt',
    APPROVED: 'Phê duyệt',
    IN_TRANSIT: 'Vận chuyển', SHIPPING: 'Vận chuyển', COMPLETED: 'Hoàn thành', REJECTED: 'Từ chối'
  };
  return labels[status] || status || '-';
}

export default PurchaseOrderDetail;
