import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import '../styles/Form.css';
import { warehouseAPI } from '../services/api';
import { canCrudWarehouseReceipt, getUser } from '../utils/permissions';

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

function WarehouseList() {
  const user = getUser();
  const canCrud = canCrudWarehouseReceipt(user);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    receivedQty: '',
    inspector: '',
    conditionDescription: '',
    waybillCode: '',
    waybillId: '',
    expectedQty: '',
    goodsCondition: '',
    itemForms: []
  });
  const [receiveFiles, setReceiveFiles] = useState([]);
  const [productFiles, setProductFiles] = useState({});
  const [variantFiles, setVariantFiles] = useState({});
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  const handleNumberBeforeInput = (e) => {
    if (e.data === null) return;
    if (e.data === '.' || e.data === ',') return;
    if (e.data === '-') return;
    if (/^[0-9]$/.test(e.data)) return;
    e.preventDefault();
  };

  const handleNumberPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/^-?\d*\.?\d*$/.test(text)) e.preventDefault();
  };

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseAPI.getPending();
      setPending(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const openReceive = (item) => {
    const targetWb = item.waybills?.find(wb => wb.waybillId === -item.poId);
    const deliveredWb = targetWb || item.waybills?.find(wb => wb.status === 'DELIVERED');
    const defaultQty = String(deliveredWb?.actualQty ?? item.remainingQty ?? item.orderedQty ?? '');
    setReceiveTarget(item);
    setForm({
      receivedQty: defaultQty,
      inspector: '',
      conditionDescription: '',
      waybillCode: deliveredWb?.waybillCode || '',
      waybillId: deliveredWb?.waybillId?.toString() || '',
      expectedQty: String(deliveredWb?.actualQty ?? item.remainingQty ?? item.orderedQty ?? ''),
      goodsCondition: 'Nguyên vẹn',
      itemForms: (item.products || []).map(p => ({
        poItemId: p.id,
        receivedQty: defaultQty,
        goodsCondition: 'Nguyên vẹn',
        conditionDescription: '',
        variantQtys: (() => {
          try {
            const parsed = JSON.parse(p.spec);
            if (Array.isArray(parsed)) return parsed.map(v => ({ name: v.name, qty: String(v.qty ?? '') }));
          } catch {}
          return null;
        })()
      }))
    });
    setError('');
  };

  const closeReceive = () => {
    setReceiveTarget(null);
    setReceiveFiles([]);
    setProductFiles({});
    setVariantFiles({});
  };

  const handleSubmitReceive = async (event) => {
    event.preventDefault();
    if (!receiveTarget) return;

    const hasProductItems = form.itemForms && form.itemForms.length > 0;

    if (hasProductItems) {
      for (const item of form.itemForms) {
        const qty = Number(item.receivedQty);
        if (!Number.isFinite(qty) || qty < 0) {
          setError('Số lượng nhận của sản phẩm "' + (item.productName || '') + '" không hợp lệ.'); return;
        }
      }
    } else {
      const receivedQty = Number(form.receivedQty);
      if (!Number.isFinite(receivedQty) || receivedQty <= 0) {
        setError('Số lượng nhận phải lớn hơn 0.'); return;
      }
      const maxQty = receiveTarget.remainingQty ?? receiveTarget.orderedQty;
      if (receivedQty > maxQty) {
        setError('Số lượng nhận không được vượt quá số lượng còn lại (' + maxQty + ').'); return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        poId: receiveTarget.poId,
        inspector: form.inspector || undefined,
        conditionDescription: form.conditionDescription || undefined,
        waybillCode: form.waybillCode || undefined,
        waybillId: form.waybillId ? Number(form.waybillId) : undefined,
        expectedQty: form.expectedQty ? Number(form.expectedQty) : undefined,
        goodsCondition: form.goodsCondition || undefined
      };
      if (hasProductItems) {
        payload.items = form.itemForms.map(item => ({
          poItemId: item.poItemId,
          receivedQty: Number(item.receivedQty),
          goodsCondition: item.goodsCondition || form.goodsCondition,
          conditionDescription: item.conditionDescription || undefined
        }));
      } else {
        payload.receivedQty = Number(form.receivedQty);
      }
      const result = await warehouseAPI.receive(payload);
      if (result && result.id) {
        const uploadPromises = [];
        if (receiveFiles.length > 0) {
          uploadPromises.push(
            warehouseAPI.uploadImages(result.id, receiveFiles).catch(err => {
              console.error('Upload ảnh chung thất bại:', err);
            })
          );
        }
        const allItemFiles = {};
        for (const [idx, files] of Object.entries(productFiles)) {
          if (files?.length) allItemFiles[idx] = [...(allItemFiles[idx] || []), ...files];
        }
        for (const [key, files] of Object.entries(variantFiles)) {
          const idx = key.split('-')[0];
          if (files?.length) allItemFiles[idx] = [...(allItemFiles[idx] || []), ...files];
        }
        for (const idx of Object.keys(allItemFiles)) {
          const files = allItemFiles[idx];
          if (files && files.length > 0) {
            const itemResult = result.items?.[parseInt(idx)];
            if (itemResult?.id) {
              uploadPromises.push(
                warehouseAPI.uploadItemImages(result.id, itemResult.id, files).catch(err => {
                  console.error(`Upload ảnh sản phẩm #${parseInt(idx) + 1} thất bại:`, err);
                })
              );
            }
          }
        }
        await Promise.all(uploadPromises);
        closeReceive();
        navigate(`/warehouse/receipts/${result.id}`);
      } else {
        closeReceive();
        await loadPending();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Nhận hàng & Kiểm đếm</h1>
          <p className="page-subtitle">Bảng đối chiếu: PO Code — Waybill Code — SL dự kiến — SL thực tế — Tình trạng</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/warehouse/receipts')}>Lịch sử nhận hàng</button>
          <button type="button" className="btn btn-secondary" onClick={loadPending}>Làm mới</button>
        </div>
      </div>

      <div className="page-content">
        {error && !receiveTarget ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : pending.length === 0 ? (
          <div className="empty-state">Không có lô hàng chờ nhận.</div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                    <tr>
                      <th>Vận đơn</th>
                      <th>ĐN Thanh toán</th>
                      <th>Mã đơn (PO Code)</th>
                      <th>Sản phẩm</th>
                      <th>SL đặt</th>
                      <th>SL đã nhận</th>
                      <th>SL còn lại</th>
                      <th>Hình thức VC</th>
                      <th>Thanh toán</th>
                      <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {pending.map((item) => {
                      const deliveredWb = item.waybills?.find(wb => wb.status === 'DELIVERED');
                      const hasWaybill = item.waybills && item.waybills.length > 0;
                      const hasDnttLink = deliveredWb?.paymentRequestId != null;
                      const canReceive = (item.poId > 0 || (item.poId < 0 && deliveredWb && hasDnttLink)) && item.remainingQty > 0;
                      return (
                      <tr key={item.poId}>
                        <td>
                          {hasWaybill ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {item.waybills.map((wb) => (
                                <a key={wb.waybillId} onClick={() => navigate(`/waybills/${wb.waybillId}`)}
                                  style={{ fontSize: 12, color: wb.status === 'DELIVERED' ? '#16a34a' : '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                                  {wb.waybillCode}
                                </a>
                              ))}
                            </div>
                          ) : <span className="muted-copy">—</span>}
                        </td>
                        <td>
                          {deliveredWb?.paymentRequestCode || deliveredWb?.paymentRequestId ? (
                            <a onClick={() => navigate(`/payments/${deliveredWb.paymentRequestId}`)}
                              style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
                              {deliveredWb.paymentRequestCode || `DNTT-${deliveredWb.paymentRequestId}`}
                            </a>
                          ) : <span className="muted-copy">—</span>}
                        </td>
                        <td>
                          {item.poId > 0 ? (
                            <a onClick={() => navigate(`/purchase-orders/${item.poId}`)}
                              style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>{item.poCode}</a>
                          ) : <span className="muted-copy">{item.poCode}</span>}
                        </td>
                        <td>
                          {item.products && item.products.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {item.products.map((p, idx) => {
                                const pVariants = parseVariants(p.spec);
                                const hasVariants = pVariants.some(v => v.name);
                                return (
                                  <span key={p.id || idx} style={{ fontSize: 12 }}>
                                    {p.productName}{p.posCode ? ` (${p.posCode})` : ''} × {p.orderedQty}
                                    {hasVariants ? ` [${pVariants.filter(v => v.name).map(v => `${v.name}:${v.qty || 0}`).join(', ')}]` : ''}
                                  </span>
                                );
                              })}
                            </div>
                          ) : <span className="muted-copy">{item.productName}</span>}
                        </td>
                        <td>{item.orderedQty}</td>
                        <td>{item.receivedQty ?? 0}</td>
                        <td><strong>{item.remainingQty ?? item.orderedQty}</strong></td>
                        <td>{item.shippingMethod || '—'}</td>
                        <td><span className={`badge badge-${(item.paymentStatus || '').toLowerCase() === 'paid' ? 'paid' : (item.paymentStatus || '').toLowerCase() === 'delivered' ? 'delivered' : 'pending'}`}>{item.paymentStatus}</span></td>
                        <td>
                          {canReceive && canCrud ? (
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => openReceive(item)}>Nhận hàng</button>
                          ) : (
                            <span className="muted-copy" style={{ fontSize: 12 }}>{hasDnttLink ? 'Đã nhập kho' : 'Chờ liên kết DNTT'}</span>
                          )}
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

      {receiveTarget ? (
        <div className="modal-overlay" role="presentation" onClick={closeReceive}>
          <div className="modal-card app-form" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640 }}>
            <h2>Nhận hàng — {receiveTarget.poCode}</h2>

            <div className="surface-card" style={{ padding: 12, marginBottom: 16, background: '#f0fdf4', borderRadius: 8 }}>
              <strong>Đối chiếu nhập kho</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div><span className="muted-copy">Vận đơn:</span><br /><strong>{form.waybillCode || '—'}</strong></div>
                <div><span className="muted-copy">SL theo vận đơn:</span><br /><strong>{form.expectedQty || '—'}</strong></div>
                <div><span className="muted-copy">Mã đơn hàng:</span><br /><strong>{receiveTarget.poCode}</strong></div>
                <div><span className="muted-copy">SL theo đơn:</span><br /><strong>{receiveTarget.orderedQty}</strong></div>
                <div><span className="muted-copy">SL đã nhận:</span><br /><strong>{receiveTarget.receivedQty ?? 0}</strong></div>
                <div><span className="muted-copy">SL còn lại:</span><br /><strong>{receiveTarget.remainingQty ?? receiveTarget.orderedQty}</strong></div>
              </div>
            </div>

            {form.itemForms && form.itemForms.length > 0 ? (
              <div className="surface-card" style={{ padding: 16, marginBottom: 16, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 20, background: '#f59e0b', borderRadius: 2 }}></span>
                  <strong style={{ fontSize: 14, color: '#1e293b' }}>Nhập số lượng & tình trạng từng sản phẩm</strong>
                </div>
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: 13 }}>
                    <colgroup>
                      <col style={{ width: 32 }} />
                      <col style={{ minWidth: 160 }} />
                      <col style={{ width: 70 }} />
                      <col style={{ width: 80 }} />
                      <col style={{ width: 50 }} />
                      <col style={{ width: 65 }} />
                      <col style={{ width: 95 }} />
                      <col style={{ minWidth: 110 }} />
                      <col style={{ width: 110 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>#</th>
                        <th>Sản phẩm</th>
                        <th>Mã POS</th>
                        <th>Chi tiết</th>
                        <th style={{ textAlign: 'center' }}>SL đặt</th>
                        <th style={{ textAlign: 'center' }}>SL nhận</th>
                        <th>Tình trạng</th>
                        <th>Ghi chú</th>
                        <th style={{ textAlign: 'center' }}>Ảnh sản phẩm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveTarget.products.flatMap((p, idx) => {
                        const pVariants = parseVariants(p.spec);
                        const hasVariants = pVariants.some(v => v.name || v.qty);
                        const rows = [];
                        const itemForm = form.itemForms[idx] || {};
                        const files = productFiles[idx] || [];
                        const isLastProduct = idx === receiveTarget.products.length - 1;
                        rows.push(
                          <tr key={p.id || idx} style={{ ...(hasVariants ? { borderBottom: 'none', background: '#fafbfc' } : {}) }}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.productName}</td>
                            <td style={{ color: '#475569' }}>{p.posCode || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                            <td style={{ fontSize: 12, color: '#64748b' }}>{!hasVariants ? (p.spec || <span style={{ color: '#cbd5e1' }}>—</span>) : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td style={{ textAlign: 'center', fontWeight: 500 }}>{p.orderedQty}</td>
                            <td style={{ textAlign: 'center' }}>
                              {hasVariants ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 14, borderRadius: 6, padding: '2px 10px', minWidth: 40 }}>
                                  {itemForm.variantQtys?.reduce((s, v) => s + (Number(v.qty) || 0), 0) ?? (itemForm.receivedQty ?? 0)}
                                </span>
                              ) : (
                                <input type="number" min="0" max={p.orderedQty}
                                  value={itemForm.receivedQty ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    const newForms = [...form.itemForms];
                                    newForms[idx] = { ...newForms[idx], receivedQty: val };
                                    setForm(f => ({ ...f, itemForms: newForms }));
                                  }}
                                  style={{ width: 56, padding: '4px 6px', fontSize: 13, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none' }}
                                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'} />
                              )}
                            </td>
                            <td>
                              <select value={itemForm.goodsCondition || ''}
                                onChange={(e) => {
                                  const newForms = [...form.itemForms];
                                  newForms[idx] = { ...newForms[idx], goodsCondition: e.target.value };
                                  setForm(f => ({ ...f, itemForms: newForms }));
                                }}
                                style={{ width: '100%', fontSize: 12, padding: '4px 4px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', color: itemForm.goodsCondition ? '#0f172a' : '#94a3b8' }}>
                                <option value="">Mặc định</option>
                                <option value="Nguyên vẹn">Nguyên vẹn</option>
                                <option value="Móp méo">Móp méo</option>
                                <option value="Thiếu hàng">Thiếu hàng</option>
                                <option value="Hỏng hóc">Hỏng hóc</option>
                              </select>
                            </td>
                            <td>
                              <input type="text" value={itemForm.conditionDescription || ''}
                                onChange={(e) => {
                                  const newForms = [...form.itemForms];
                                  newForms[idx] = { ...newForms[idx], conditionDescription: e.target.value };
                                  setForm(f => ({ ...f, itemForms: newForms }));
                                }}
                                style={{ width: '100%', fontSize: 12, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none' }}
                                placeholder="Ghi chú riêng..."
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasVariants ? <span style={{ color: '#cbd5e1' }}>—</span> : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#3b82f6', padding: '2px 8px', border: '1px dashed #93c5fd', borderRadius: 4, background: '#eff6ff' }}>
                                  <span>+</span> Chọn ảnh
                                  <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const selected = Array.from(e.target.files).slice(0, 3);
                                      const totalSize = selected.reduce((s, f) => s + f.size, 0);
                                      if (totalSize > MAX_FILE_SIZE) {
                                        alert('Tổng dung lượng ảnh vượt quá 20MB.');
                                        return;
                                      }
                                      setProductFiles(prev => ({ ...prev, [idx]: selected }));
                                    }} />
                                </label>
                                {files.length > 0 && (
                                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {files.map((f, fi) => (
                                      <div key={fi} style={{
                                        width: 36, height: 27, borderRadius: 3, overflow: 'hidden',
                                        border: '1px solid #e5e7eb', background: '#f9fafb'
                                      }}>
                                        <img src={URL.createObjectURL(f)} alt=""
                                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                        if (hasVariants) {
                          pVariants.forEach((v, vi) => {
                            if (!v.name && !v.qty) return;
                            const key = `${idx}-${vi}`;
                            const vFiles = variantFiles[key] || [];
                            rows.push(
                              <tr key={`${p.id || idx}-v${vi}`} style={{ background: '#f8fafc', borderBottom: vi === pVariants.length - 1 && !isLastProduct ? '2px solid #e2e8f0' : vi === pVariants.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                <td></td>
                                <td style={{ paddingLeft: 28, fontSize: 13, color: '#334155' }}>
                                  <span style={{ color: '#94a3b8', marginRight: 6, fontSize: 11 }}>└</span> {v.name}
                                </td>
                                <td style={{ color: '#cbd5e1' }}>—</td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                                <td style={{ textAlign: 'center', color: '#475569' }}>{v.qty || 0}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <input type="number" min="0"
                                    value={itemForm.variantQtys?.[vi]?.qty ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      const newForms = [...form.itemForms];
                                      const newVariants = [...(newForms[idx].variantQtys || [])];
                                      newVariants[vi] = { ...newVariants[vi], qty: val };
                                      const total = newVariants.reduce((s, v) => s + (Number(v.qty) || 0), 0);
                                      newForms[idx] = { ...newForms[idx], variantQtys: newVariants, receivedQty: String(total) };
                                      setForm(f => ({ ...f, itemForms: newForms }));
                                    }}
                                    style={{ width: 52, padding: '3px 4px', fontSize: 12, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'} />
                                </td>
                                <td style={{ textAlign: 'center', color: '#cbd5e1' }}>—</td>
                                <td style={{ textAlign: 'center', color: '#cbd5e1' }}>—</td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#3b82f6', padding: '2px 8px', border: '1px dashed #93c5fd', borderRadius: 4, background: '#eff6ff' }}>
                                    <span>+</span> Ảnh
                                    <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const selected = Array.from(e.target.files).slice(0, 3);
                                        const totalSize = selected.reduce((s, f) => s + f.size, 0);
                                        if (totalSize > MAX_FILE_SIZE) {
                                          alert('Tổng dung lượng ảnh vượt quá 20MB.');
                                          return;
                                        }
                                        setVariantFiles(prev => ({ ...prev, [key]: selected }));
                                      }} />
                                  </label>
                                  {vFiles.length > 0 && (
                                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                                      {vFiles.map((f, fi) => (
                                        <div key={fi} style={{
                                          width: 36, height: 27, borderRadius: 3, overflow: 'hidden',
                                          border: '1px solid #e5e7eb', background: '#f9fafb'
                                        }}>
                                          <img src={URL.createObjectURL(f)} alt=""
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  </div>
                                </td>
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
            ) : receiveTarget.products && receiveTarget.products.length > 0 && (
              <div className="surface-card" style={{ padding: 12, marginBottom: 16, background: '#fff7ed', borderRadius: 8 }}>
                <strong style={{ fontSize: 13 }}>Danh sách sản phẩm ({receiveTarget.products.length})</strong>
                <div className="table-wrapper" style={{ marginTop: 8 }}>
                  <table className="table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>#</th>
                        <th>Sản phẩm</th>
                        <th style={{ width: 80 }}>Mã POS</th>
                        <th style={{ width: 70 }}>Chi tiết</th>
                        <th style={{ width: 50 }}>SL đặt</th>
                        <th style={{ width: 80 }}>Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveTarget.products.flatMap((p, idx) => {
                        const pVariants = parseVariants(p.spec);
                        const hasVariants = pVariants.some(v => v.name || v.qty);
                        const rows = [];
                        rows.push(
                          <tr key={p.id || idx}>
                            <td>{idx + 1}</td>
                            <td>{p.productName}</td>
                            <td>{p.posCode || '-'}</td>
                            <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (p.spec || '-') : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td>{p.orderedQty}</td>
                            <td>{p.unitPrice ? Number(p.unitPrice).toLocaleString() + ' ' + p.currency : '-'}</td>
                          </tr>
                        );
                        if (hasVariants) {
                          pVariants.forEach((v, vi) => {
                            if (!v.name && !v.qty) return;
                            rows.push(
                              <tr key={`${p.id || idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                                <td></td>
                                <td style={{ paddingLeft: 24, fontSize: 12, color: '#475569' }}>
                                  <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                                </td>
                                <td></td>
                                <td style={{ fontSize: 11, color: '#64748b' }}>{v.name}</td>
                                <td>{v.qty || 0}</td>
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
            )}

            {error ? <div className="error-message">{error}</div> : null}

            <form onSubmit={handleSubmitReceive}>
              {(!form.itemForms || form.itemForms.length === 0) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Mã vận đơn (Waybill Code)</label>
                    <input value={form.waybillCode} onChange={(e) => setForm(f => ({ ...f, waybillCode: e.target.value }))} placeholder="Nhập mã vận đơn" />
                  </div>
                  <div className="form-group">
                    <label>SL hàng theo vận đơn</label>
                    <input type="number" value={form.expectedQty} onChange={(e) => setForm(f => ({ ...f, expectedQty: e.target.value.replace(/[^0-9]/g, '') }))} />
                  </div>
                </div>
              )}
              {(!form.itemForms || form.itemForms.length === 0) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>SL thực tế nhập kho *</label>
                    <input type="number" min="1" max={receiveTarget.remainingQty ?? receiveTarget.orderedQty} value={form.receivedQty}
                      onChange={(e) => setForm(f => ({ ...f, receivedQty: e.target.value.replace(/[^0-9.,-]/g, '') }))}
                      onBeforeInput={handleNumberBeforeInput} onPaste={handleNumberPaste} required />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng hàng hóa (chung)</label>
                    <select value={form.goodsCondition} onChange={(e) => setForm(f => ({ ...f, goodsCondition: e.target.value }))}>
                      <option value="Nguyên vẹn">Nguyên vẹn</option>
                      <option value="Móp méo">Móp méo</option>
                      <option value="Thiếu hàng">Thiếu hàng</option>
                      <option value="Hỏng hóc">Hỏng hóc</option>
                    </select>
                  </div>
                </div>
              )}
              {form.itemForms && form.itemForms.length > 0 && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Tình trạng lô hàng</label>
                    <select value={form.goodsCondition} onChange={(e) => setForm(f => ({ ...f, goodsCondition: e.target.value }))}>
                      <option value="Nguyên vẹn">Nguyên vẹn</option>
                      <option value="Móp méo">Móp méo</option>
                      <option value="Thiếu hàng">Thiếu hàng</option>
                      <option value="Hỏng hóc">Hỏng hóc</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Người kiểm</label>
                <input value={form.inspector} onChange={(e) => setForm(f => ({ ...f, inspector: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ghi chú tình trạng</label>
                <textarea rows={2} value={form.conditionDescription} onChange={(e) => setForm(f => ({ ...f, conditionDescription: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ảnh lô hàng</label>
                <input type="file" multiple accept="image/*" onChange={(e) => {
                  const files = Array.from(e.target.files).slice(0, 3);
                  const totalSize = files.reduce((s, f) => s + f.size, 0);
                  if (totalSize > MAX_FILE_SIZE) {
                    alert('Tổng dung lượng ảnh vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn.');
                    return;
                  }
                  setReceiveFiles(files);
                }} />
                {receiveFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {receiveFiles.map((f, idx) => (
                      <div key={idx} style={{
                        width: 80, height: 60, borderRadius: 6, overflow: 'hidden',
                        border: '1px solid #e5e7eb', background: '#f9fafb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <img src={URL.createObjectURL(f)} alt={`preview ${idx}`}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeReceive}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Xác nhận nhận hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default WarehouseList;
