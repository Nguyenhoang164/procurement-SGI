import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { waybillAPI, purchaseOrderAPI, paymentRequestAPI } from '../services/api';
import { formatDnttCode } from '../utils/paymentUtils';
import { useToast } from '../components/Toast';
import PosCodeSelector from '../components/PosCodeSelector';

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

const calcTotalQty = (variants) => {
  return variants.reduce((sum, v) => sum + (Number(v.qty) || 0), 0);
};

const emptyProduct = {
  posCode: '', productName: '', spec: '', orderedQty: '', unitPrice: '', currency: 'CNY', exchangeRate: '3520'
};

function WaybillNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [linkedWaybills, setLinkedWaybills] = useState([]);
  const [sourceDntts, setSourceDntts] = useState([]);
  const [productForm, setProductForm] = useState({ ...emptyProduct });
  const [formVariants, setFormVariants] = useState([{ name: '', qty: '' }]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [form, setForm] = useState({
    waybillCode: '', carrier: '', status: 'IN_TRANSIT',
    origin: '', destination: '',
    expectedQty: '', actualQty: '',
    paymentRequestId: '', note: ''
  });

  useEffect(() => {
    paymentRequestAPI.getAll().then(setPaymentRequests).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.paymentRequestId) { setSourceDntts([]); return; }
    const loadProductsFromPR = async () => {
      try {
        const pr = await paymentRequestAPI.getById(form.paymentRequestId);
        let sourceIds = [];
        try { if (pr.sourceDnttIds) sourceIds = JSON.parse(pr.sourceDnttIds); } catch {}
        if (sourceIds.length > 0) {
          const dntts = await Promise.all(sourceIds.map(sid => paymentRequestAPI.getById(sid)));
          setSourceDntts(dntts);
        } else {
          setSourceDntts([]);
        }
        const poId = pr.poId;
        if (!poId) return;
        const po = await purchaseOrderAPI.getById(poId);
        if (po.items && po.items.length > 0) {
          const mapped = po.items.map(item => ({
            posCode: item.posCode || '',
            productName: item.productName || '',
            spec: item.spec || '',
            orderedQty: String(item.orderedQty || ''),
            unitPrice: String(item.unitPrice || ''),
            currency: item.currency || 'CNY',
            exchangeRate: String(item.exchangeRate || '3520')
          }));
          setProducts(mapped);
          const total = mapped.reduce((sum, p) => sum + (Number(p.orderedQty) || 0), 0);
          setForm(prev => ({ ...prev, expectedQty: String(total), actualQty: '' }));
        }
      } catch {}
    };
    loadProductsFromPR();
  }, [form.paymentRequestId]);

  useEffect(() => {
    if (!form.paymentRequestId) { setLinkedWaybills([]); setSourceDntts([]); return; }
    waybillAPI.getByPaymentRequestId(form.paymentRequestId)
      .then(setLinkedWaybills)
      .catch(() => {});
  }, [form.paymentRequestId]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await waybillAPI.getById(id);
        setForm({
          waybillCode: data.waybillCode || '', carrier: data.carrier || '',
          status: data.status || 'IN_TRANSIT',
          origin: data.origin || '', destination: data.destination || '',
          expectedQty: data.expectedQty ?? '', actualQty: data.actualQty ?? '',
          paymentRequestId: String(data.paymentRequestId || ''), note: data.note || ''
        });
        if (data.products) {
          try {
            const parsed = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
            if (Array.isArray(parsed)) setProducts(parsed);
          } catch {}
        }
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addOrUpdateProduct = () => {
    if (!productForm.productName) { toast.error('Thiếu tên sản phẩm.'); return; }
    const totalQty = calcTotalQty(formVariants);
    if (totalQty <= 0) { toast.error('Thiếu số lượng cho biến thể.'); return; }
    setError('');
    const productPayload = {
      ...productForm,
      spec: JSON.stringify(formVariants),
      orderedQty: String(totalQty)
    };
    if (editingIdx !== null) {
      setProducts(prev => prev.map((p, i) => i === editingIdx ? productPayload : p));
      setEditingIdx(null);
    } else {
      setProducts(prev => [...prev, productPayload]);
    }
    setProductForm({ ...emptyProduct });
    setFormVariants([{ name: '', qty: '' }]);
  };

  const editProduct = (idx) => {
    setProductForm({ ...products[idx] });
    setFormVariants(parseVariants(products[idx].spec));
    setEditingIdx(idx);
  };

  const removeProduct = (idx) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) { setProductForm({ ...emptyProduct }); setFormVariants([{ name: '', qty: '' }]); setEditingIdx(null); }
  };

  const resetProductForm = () => {
    setProductForm({ ...emptyProduct });
    setFormVariants([{ name: '', qty: '' }]);
    setEditingIdx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      ...form,
      expectedQty: form.expectedQty ? Number(form.expectedQty) : null,
      actualQty: form.actualQty ? Number(form.actualQty) : null,
      paymentRequestId: form.paymentRequestId ? Number(form.paymentRequestId) : null,
      products: products.length > 0 ? JSON.stringify(products) : null
    };
    if (!isEdit) {
      delete payload.waybillCode;
    }
    try {
      if (isEdit) {
        await waybillAPI.update(id, payload);
        navigate(`/waybills/${id}`);
      } else {
        const created = await waybillAPI.create(payload);
        navigate(`/waybills/${created.id}`);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{isEdit ? 'Cập nhật vận đơn' : 'Tạo vận đơn mới'}</h1>
          <p className="page-subtitle">Waybill — theo dõi vận chuyển và đối chiếu kho</p>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Mã vận đơn</label>
              {isEdit ? (
                <input name="waybillCode" value={form.waybillCode} onChange={handleChange} required />
              ) : (
                <input value="Tự động tạo khi lưu" disabled style={{ color: '#888', fontStyle: 'italic' }} />
              )}
            </div>
            <div className="form-group">
              <label>Đơn vị vận chuyển <span className="required">*</span></label>
              <input name="carrier" value={form.carrier} onChange={handleChange} placeholder="VD: DHL, FedEx" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Liên kết DNTT</label>
              <select name="paymentRequestId" value={form.paymentRequestId} onChange={handleChange}>
                <option value="">-- Không liên kết --</option>
                {paymentRequests.filter(pr => pr.type === 'VAN_CHUYEN').map(pr => (
                  <option key={pr.id} value={pr.id}>DNTT-{pr.id} - {pr.amountVnd?.toLocaleString('vi-VN')}₫</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="PENDING">Chờ vận chuyển</option>
                <option value="IN_TRANSIT">Đang vận chuyển</option>
                <option value="DELIVERED">Đã giao</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>

          {sourceDntts.length > 0 && (
            <div className="surface-card" style={{ padding: 12, marginBottom: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <strong style={{ fontSize: 13, color: '#166534' }}>DNTT Mua hàng liên kết ({sourceDntts.length})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {sourceDntts.map(dntt => (
                  <div key={dntt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                    <a href={`/payments/${dntt.id}`} style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>
                      {formatDnttCode(dntt.id)}
                    </a>
                    <span className="muted-copy">{Number(dntt.amountVnd || 0).toLocaleString('vi-VN')} ₫</span>
                    <span className="muted-copy">{dntt.poIds ? dntt.poIds.map(id => `PO-${id}`).join(', ') : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {linkedWaybills.length > 0 && (
            <div className="surface-card" style={{ padding: 12, marginBottom: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: 13 }}>Các vận đơn khác cùng DNTT ({linkedWaybills.length})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {linkedWaybills.map(wb => (
                  <div key={wb.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                    <a onClick={() => navigate(`/waybills/${wb.id}`)}
                      style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                      {wb.waybillCode}
                    </a>
                    <span className={`badge badge-${(wb.status || '').toLowerCase()}`}>{wb.status}</span>
                    <span className="muted-copy">{wb.carrier || ''}</span>
                    <span className="muted-copy">SL dự kiến: {wb.expectedQty ?? '-'}</span>
                    <span className="muted-copy">SL thực tế: {wb.actualQty ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>SL dự kiến <span className="required">*</span></label>
              <input type="number" name="expectedQty" value={form.expectedQty} onChange={handleChange} placeholder="0" required />
            </div>
            <div className="form-group">
              <label>SL thực tế</label>
              <input type="number" name="actualQty" value={form.actualQty} onChange={handleChange} placeholder="0" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Địa chỉ gửi</label>
              <input name="origin" value={form.origin} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Địa chỉ nhận</label>
              <input name="destination" value={form.destination} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="note" rows={3} value={form.note} onChange={handleChange} />
          </div>

          <fieldset style={{ marginTop: 20 }}>
            <legend>Danh sách sản phẩm ({products.length})</legend>

            <div className="table-wrapper" style={{ marginTop: 12 }}>
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Sản phẩm</th>
                    <th style={{ minWidth: 160 }}>Chi tiết</th>
                    <th style={{ width: 60 }}>SL</th>
                    <th style={{ width: 110 }}>Đơn giá (NT)</th>
                    <th style={{ width: 60 }}>TG</th>
                    <th style={{ width: 110 }}>Thành tiền (NT)</th>
                    <th style={{ width: 100 }}>Quy đổi VNĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
                        Chưa có sản phẩm. Vui lòng chọn DNTT để tải sản phẩm từ đơn hàng.
                      </td>
                    </tr>
                  )}
                  {products.flatMap((p, idx) => {
                    const pVariants = parseVariants(p.spec);
                    const hasVariants = pVariants.some(v => v.name || v.qty);
                    const sub = (Number(p.unitPrice) || 0) * (Number(p.orderedQty) || 0);
                    const vnd = Math.round(sub * (Number(p.exchangeRate) || 1));
                    return [
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{p.productName}{p.posCode ? ` (${p.posCode})` : ''}</td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (p.spec || '-') : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                        <td>{p.orderedQty}</td>
                        <td>{Number(p.unitPrice || 0).toLocaleString()} {p.currency || 'CNY'}</td>
                        <td>{p.exchangeRate || '3520'}</td>
                        <td>{sub.toLocaleString()} {p.currency || 'CNY'}</td>
                        <td className="money">{vnd.toLocaleString('vi-VN')} ₫</td>
                      </tr>,
                      ...(hasVariants ? pVariants.filter(v => v.name || v.qty).map((v, vi) => (
                        <tr key={`${idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                          <td></td>
                          <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569' }}>
                            <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                          </td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                          <td>{v.qty || 0}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      )) : [])
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/waybills')}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo vận đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WaybillNew;
