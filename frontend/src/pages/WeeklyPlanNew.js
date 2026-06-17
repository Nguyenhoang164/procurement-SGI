import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { weeklyPlanAPI, tradeRouteAPI } from '../services/api';
import PosCodeSelector from '../components/PosCodeSelector';

const CURRENCIES = ['CNY', 'USD', 'VND', 'JPY', 'KRW', 'PHP', 'EUR', 'GBP', 'AUD', 'SGD', 'THB', 'MYR'];

const HelpIcon = ({ text }) => (
  <span title={text}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', fontSize: 10, fontWeight: 700, cursor: 'help', marginLeft: 4, verticalAlign: 'middle', lineHeight: '16px' }}>
    ?
  </span>
);

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

const emptyForm = {
  productName: '', posCode: '', productType: 'USED', suggestedQty: '',
  country: '', tradeRoute: '', shippingMethod: '', referencePrice: '', currency: 'CNY',
  spec: '', sourceLink: '', priorityLevel: 'Trung bình', landing: ''
};
const blankForm = {
  productName: '', posCode: '', productType: 'USED', suggestedQty: '',
  country: '', tradeRoute: '', shippingMethod: '', referencePrice: '', currency: 'CNY',
  spec: '', sourceLink: '', priorityLevel: 'Trung bình', landing: ''
};

function WeeklyPlanNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [formVariants, setFormVariants] = useState([{ name: '', qty: '' }]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tradeRoutes, setTradeRoutes] = useState([]);

  useEffect(() => {
    tradeRouteAPI.getActive().then(setTradeRoutes).catch(() => {});
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!id) return;
    try {
      const data = await weeklyPlanAPI.getById(id);
      setNote(data.note || '');
      if (data.items && data.items.length > 0) {
        setItems(data.items.map(item => ({
          productName: item.productName || '', posCode: item.posCode || '',
          productType: item.productType || 'USED', suggestedQty: item.suggestedQty || '',
          country: item.country || '', tradeRoute: item.tradeRoute || '', shippingMethod: item.shippingMethod || '',
          referencePrice: item.referencePrice || '', currency: item.currency || 'CNY',
          spec: item.spec || '', sourceLink: item.sourceLink || '',
          priorityLevel: item.priorityLevel || 'Trung bình', landing: item.landing || ''
        })));
        setForm({ ...blankForm });
        setFormVariants([{ name: '', qty: '' }]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setFormVariants([{ name: '', qty: '' }]);
    setEditingIndex(null);
  };

  const addOrUpdateItem = () => {
    if (!form.productName) { setError('Thiếu tên sản phẩm.'); return; }

    const totalQty = calcTotalQty(formVariants);
    if (totalQty <= 0) { setError('Thiếu số lượng cho biến thể.'); return; }

    const itemPayload = {
      ...form,
      spec: JSON.stringify(formVariants),
      suggestedQty: totalQty
    };

    if (editingIndex !== null) {
      setItems(prev => prev.map((item, i) => i === editingIndex ? itemPayload : item));
    } else {
      setItems(prev => [...prev, itemPayload]);
    }
    resetForm();
    setError('');
  };

  const editItem = (index) => {
    const item = items[index];
    setForm({ ...item });
    setFormVariants(parseVariants(item.spec));
    setEditingIndex(index);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setForm({ ...emptyForm });
      setFormVariants([{ name: '', qty: '' }]);
      setEditingIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { setError('Danh sách sản phẩm trống — thêm ít nhất 1 sản phẩm trước khi lưu.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = { note, items };
      if (id) { await weeklyPlanAPI.update(id, payload); }
      else { await weeklyPlanAPI.create(payload); }
      navigate('/weekly-plans');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{id ? 'Cập nhật kế hoạch tuần' : 'Thêm kế hoạch nhập hàng'}</h1>
          <p className="page-subtitle">Form PKD1 — Nhập thông tin → Thêm vào danh sách → Lưu kế hoạch</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/weekly-plans')}>Quay lại</button>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Nhập thông tin sản phẩm</legend>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Chọn sản phẩm (tra cứu hoặc tạo mới) <span className="required">*</span><HelpIcon text="Chọn sản phẩm có sẵn hoặc tạo mới từ danh sách" /></label>
                <PosCodeSelector value={form.posCode}
                  onChange={(v) => setForm(f => ({ ...f, posCode: v }))}
                  onProductSelect={(p) => {
                    setForm(f => ({ ...f, posCode: p.posCode, productName: p.productName }));
                    if (p.spec) {
                      const parsed = parseVariants(p.spec);
                      if (parsed.some(v => v.name)) setFormVariants(parsed);
                    }
                  }} />
              </div>
              <div className="form-group">
                <label>Tên sản phẩm <span className="required">*</span><HelpIcon text="Tên sản phẩm nhập khẩu (VD: Máy lọc nước XH-01)" /></label>
<input value={form.productName}
  onChange={(e) => setForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Loại SP<HelpIcon text="Hàng mới (NEW) chưa từng nhập hoặc hàng cũ (USED) đã nhập trước đó" /></label>
                <select value={form.productType}
                  onChange={(e) => setForm(f => ({ ...f, productType: e.target.value }))}>
                  <option value="USED">Hàng cũ</option>
                  <option value="NEW">Hàng mới</option>
                </select>
              </div>
            </div>

            <div className="form-row cols-4">
              <div className="form-group">
                <label>Landing page<HelpIcon text="Link sản phẩm trên website bán hàng (VD: shopee.vn/...) để đối chiếu thông tin" /></label>
                <input value={form.landing}
                  onChange={(e) => setForm(f => ({ ...f, landing: e.target.value }))}
                  placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Tuyến hàng<HelpIcon text="Tuyến vận chuyển từ nước ngoài về kho Việt Nam" /></label>
                <select value={form.tradeRoute}
                  onChange={(e) => setForm(f => ({ ...f, tradeRoute: e.target.value }))}>
                  <option value="">Chọn tuyến...</option>
                  {tradeRoutes.map(r => (
                    <option key={r.id} value={r.routeName}>{r.routeName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hình thức VC<HelpIcon text="Phương thức vận chuyển: AIR (hàng không), SEA (đường biển), LAND (đường bộ)" /></label>
                <select value={form.shippingMethod}
                  onChange={(e) => setForm(f => ({ ...f, shippingMethod: e.target.value }))}>
                  <option value="">Chọn...</option>
                  <option value="AIR">AIR</option>
                  <option value="SEA">SEA</option>
                  <option value="AIR PHI">AIR PHI</option>
                  <option value="LAND">LAND</option>
                </select>
              </div>
              <div className="form-group">
                <label>Giá nhập tham khảo<HelpIcon text="Giá nhập từ nhà cung cấp (có thể tham khảo từ đơn hàng cũ hoặc báo giá)" /></label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" value={form.referencePrice}
                    onChange={(e) => setForm(f => ({ ...f, referencePrice: e.target.value.replace(/[^0-9.,-]/g, '') }))}
                    style={{ flex: 1 }} />
                  <select value={form.currency}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                    style={{ width: 80, padding: '10px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mức độ ưu tiên<HelpIcon text="Cao: nhập gấp, Trung bình: nhập trong tháng, Thấp: có thể chờ" /></label>
                <select value={form.priorityLevel}
                  onChange={(e) => setForm(f => ({ ...f, priorityLevel: e.target.value }))}>
                  <option value="Cao">Cao</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Thấp">Thấp</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link nguồn<HelpIcon text="Link sản phẩm trên trang TMĐT (Taobao, 1688, Alibaba,...)" /></label>
                <input type="url" value={form.sourceLink}
                  onChange={(e) => setForm(f => ({ ...f, sourceLink: e.target.value }))}
                  placeholder="https://taobao.com/..." />
              </div>
              <div className="form-group">
                <label>SL đề xuất <span className="required">*</span><HelpIcon text="Tổng số lượng tự động tính từ các biến thể phía dưới" /></label>
                <input type="number" value={calcTotalQty(formVariants) || ''} readOnly
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div className="form-row" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 300 }}>
                <label>Biến thể & Số lượng <span className="required">*</span><HelpIcon text="Khai báo biến thể (size/màu sắc/phiên bản) và số lượng tương ứng của từng biến thể" /></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {formVariants.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input value={v.name}
                        onChange={(e) => {
                          const next = [...formVariants];
                          next[i] = { ...next[i], name: e.target.value };
                          setFormVariants(next);
                        }}
                        placeholder={`Biến thể ${i + 1}`}
                        style={{ flex: 1 }} />
                      <input type="number" value={v.qty}
                        onChange={(e) => {
                          const next = [...formVariants];
                          next[i] = { ...next[i], qty: e.target.value.replace(/[^0-9]/g, '') };
                          setFormVariants(next);
                        }}
                        placeholder="SL"
                        style={{ width: 80 }} />
                      {formVariants.length > 1 && (
                        <button type="button" onClick={() => setFormVariants(formVariants.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '4px 6px' }}>×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormVariants([...formVariants, { name: '', qty: '' }])}
                    style={{ background: 'none', border: '1px dashed #94a3b8', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 13, color: '#64748b', marginTop: 2, alignSelf: 'flex-start' }}>
                    + Thêm biến thể
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={addOrUpdateItem}>
                {editingIndex !== null ? `Cập nhật sản phẩm #${editingIndex + 1}` : 'Thêm vào danh sách'}
              </button>
              {editingIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Hủy chỉnh sửa</button>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>Danh sách sản phẩm ({items.length})</legend>
            {items.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                Chưa có sản phẩm nào. Nhập thông tin phía trên và nhấn "Thêm vào danh sách".
              </div>
            ) : (
              <div className="table-card">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 160 }}>Tên sản phẩm</th>
                        <th style={{ width: 100 }}>Mã POS</th>
                        <th style={{ width: 80 }}>Loại hàng</th>
                        <th style={{ width: 50 }}>SL</th>
                        <th style={{ width: 100 }}>Tuyến hàng</th>
                        <th style={{ width: 50 }}>VC</th>
                        <th style={{ width: 90 }}>Giá nhập TK</th>
                        <th style={{ width: 50 }}>TG</th>
                        <th style={{ width: 60 }}>Ưu tiên</th>
                        <th style={{ width: 100 }}>Chi tiết</th>
                        <th style={{ width: 100 }}>Landing</th>
                        <th style={{ width: 110 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.flatMap((item, index) => {
                        const itemVariants = parseVariants(item.spec);
                        const hasVariants = itemVariants.some(v => v.name || v.qty);
                        const rows = [];
                        rows.push(
                          <tr key={index} className={editingIndex === index ? 'row-editing' : ''}>
                            <td>{index + 1}</td>
                            <td>{item.productName}</td>
                            <td>{item.posCode || '-'}</td>
                            <td>{item.productType === 'NEW' ? 'Hàng mới' : item.productType === 'USED' ? 'Hàng cũ' : item.productType || '-'}</td>
                            <td>{item.suggestedQty}</td>
                            <td>{item.tradeRoute || '-'}</td>
                            <td>{item.shippingMethod || '-'}</td>
                            <td>{item.referencePrice ? Number(item.referencePrice).toLocaleString() : '-'}</td>
                            <td>{item.currency || 'CNY'}</td>
                            <td>{item.priorityLevel}</td>
                            <td>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.landing ? (
                                <a href={item.landing} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{item.landing}</a>
                              ) : '-'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" className="btn btn-sm btn-view" onClick={() => editItem(index)}>Sửa</button>
                                <button type="button" className="btn btn-sm btn-delete" onClick={() => removeItem(index)}>Xóa</button>
                              </div>
                            </td>
                          </tr>
                        );
                        if (hasVariants) {
                          itemVariants.forEach((v, vi) => {
                            if (!v.name && !v.qty) return;
                            rows.push(
                              <tr key={`${index}-v${vi}`} style={{ background: '#f8fafc' }}>
                                <td></td>
                                <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569' }}>
                                  <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                                </td>
                                <td></td>
                                <td></td>
                                <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
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
            )}
          </fieldset>

          <div className="form-group">
            <label>Ghi chú phiếu kế hoạch<HelpIcon text="Ghi chú chung cho toàn bộ phiếu kế hoạch (VD: ưu tiên, yêu cầu đặc biệt,...)" /></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0}>
              {loading ? 'Đang lưu...' : 'Lưu kế hoạch'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/weekly-plans')}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WeeklyPlanNew;

