import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { purchaseOrderAPI, exchangeRateAPI, productAPI, productCostAPI } from '../services/api';
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

const emptyItemForm = {
  productName: '', posCode: '', spec: '', orderedQty: '', unitPrice: '',
  currency: 'CNY', exchangeRate: '3520', country: 'Trung Quốc', shippingMethod: 'AIR PHI',
  priority: 'NORMAL', productType: 'NEW', department: '',
  weightedAvgCostVnd: '', latestUnitCostVnd: '', latestOrderCode: '', latestCostDate: ''
};
const blankItemForm = {
  productName: '', posCode: '', spec: '', orderedQty: '', unitPrice: '',
  currency: '', exchangeRate: '', country: '', shippingMethod: '',
  productType: '', department: '', weightedAvgCostVnd: '', latestUnitCostVnd: '', latestOrderCode: '', latestCostDate: ''
};

function PurchaseOrderNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({ ...emptyItemForm });
  const [formVariants, setFormVariants] = useState([{ name: '', qty: '' }]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [status, setStatus] = useState(id ? '' : 'PENDING_L1');
  const [sourcePlanId, setSourcePlanId] = useState(null);
  const [header, setHeader] = useState({
    supplierName: '', orderDate: '', freightPaymentDate: '', paymentMethod: 'CNY qua CK bank',
    landing: '',
    packageMeasurement: '', note: '', domesticShippingVnd: '0', intlShippingVnd: '0',
    internationalShippingUnitPriceVnd: '0', orderFeeVnd: '0', localDeliveryFeeVnd: '0',
    depositVnd: '0', initiatorDepartment: '', shippingMethod: ''
  });
  const [exchangeRates, setExchangeRates] = useState({});
  const [productMap, setProductMap] = useState({});
  const [costMap, setCostMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(!!id);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoadingOrder(true);
    try {
      const data = await purchaseOrderAPI.getById(id);
      setStatus(data.status || 'DRAFT');
      setSourcePlanId(data.sourcePlanId || null);
      setHeader({
        supplierName: data.supplierName || '', orderDate: data.orderDate || '',
        freightPaymentDate: data.freightPaymentDate || '',
        paymentMethod: data.paymentMethod || 'CNY qua CK bank',
        landing: data.landing || '',
        packageMeasurement: data.packageMeasurement || '',
        note: data.note || '',
        domesticShippingVnd: data.domesticShippingVnd ?? '0',
        intlShippingVnd: data.intlShippingVnd ?? '0',
        internationalShippingUnitPriceVnd: data.internationalShippingUnitPriceVnd ?? '0',
        orderFeeVnd: data.orderFeeVnd ?? '0',
        localDeliveryFeeVnd: data.localDeliveryFeeVnd ?? '0',
        depositVnd: data.depositVnd ?? '0',
        shippingMethod: data.shippingMethod ?? ''
      });
       if (data.items && data.items.length > 0) {
          setItems(data.items.map(item => ({
            productName: item.productName || '',
            posCode: item.posCode || '',
            spec: item.spec || '',
            orderedQty: item.orderedQty ?? '',
            unitPrice: item.unitPrice ?? '',
            currency: item.currency || 'CNY',
            exchangeRate: item.exchangeRate ?? '3520',
            country: item.country || 'Trung Quốc',
            shippingMethod: item.shippingMethod || 'AIR PHI',
           priority: item.priority || 'NORMAL',
           productType: item.productType || 'NEW',
           department: item.department || '',
            weightedAvgCostVnd: item.weightedAvgCostVnd ?? costMap[item.posCode]?.weightedAvgCostVnd ?? '',
            latestUnitCostVnd: item.latestUnitCostVnd ?? costMap[item.posCode]?.latestUnitCostVnd ?? '',
            latestOrderCode: item.latestOrderCode ?? costMap[item.posCode]?.latestOrderCode ?? '',
            latestCostDate: item.latestCostDate ?? costMap[item.posCode]?.latestCostDate ?? ''
          })));
        setItemForm({ ...blankItemForm });
        setFormVariants([{ name: '', qty: '' }]);
       }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrder(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    exchangeRateAPI.getAll().then((data) => {
      const rateMap = {};
      data.forEach((r) => { rateMap[r.currency] = r.rate; });
      setExchangeRates(rateMap);
    }).catch(() => {});
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

  useEffect(() => {
    if (!itemForm.posCode) return;
    const cost = costMap[itemForm.posCode];
    if (cost) {
      setItemForm(f => {
        if (f.weightedAvgCostVnd || f.latestUnitCostVnd) return f;
        return {
          ...f,
          weightedAvgCostVnd: cost.weightedAvgCostVnd ?? '',
          latestUnitCostVnd: cost.latestUnitCostVnd ?? '',
          latestOrderCode: cost.latestOrderCode ?? '',
          latestCostDate: cost.latestCostDate ?? ''
        };
      });
    }
  }, [itemForm.posCode, costMap]);

  const getName = (item) => item.productName || productMap[item.posCode] || '-';

  useEffect(() => {
    if (id) return;
    const plan = location.state?.fromPlan;
        if (plan) {
          setSourcePlanId(plan.id);
          const planShipping = plan.items?.[0]?.shippingMethod || '';
          setHeader(prev => ({ ...prev, note: plan.note || '', initiatorDepartment: plan.initiatorDepartment || '', shippingMethod: planShipping }));
          if (plan.items && plan.items.length > 0) {
           const mapped = plan.items.map(item => {
             const currency = item.currency || 'CNY';
             const rate = item.exchangeRate || exchangeRates[currency] || (currency === 'CNY' ? 3520 : currency === 'USD' ? 25400 : currency === 'TWD' ? 780 : 3520);
             return {
               productName: item.productName || '',
               posCode: item.posCode || '',
               spec: item.spec || '',
               orderedQty: item.suggestedQty ?? '',
               unitPrice: item.referencePrice ?? '',
               currency,
               exchangeRate: String(rate),
               country: item.country || 'Trung Quốc',
               shippingMethod: item.shippingMethod || 'AIR PHI',
               priority: item.priority || 'NORMAL',
               productType: item.productType || 'NEW',
               department: item.department || ''
             };
           });
            setItems(mapped);
          }
        }
   }, [id, location.state, exchangeRates]);

  const calculated = useMemo(() => {
    const itemTotals = items.map(item => {
      const qty = parseInt(item.orderedQty, 10) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const rate = parseFloat(item.exchangeRate) || 1;
      const totalGoodsAmount = unitPrice * qty;
      const totalGoodsCostVnd = totalGoodsAmount * rate;
      return { qty, unitPrice, totalGoodsAmount, totalGoodsCostVnd: Math.round(totalGoodsCostVnd) };
    });
    const totalQty = itemTotals.reduce((s, t) => s + t.qty, 0);
    const totalGoodsAmount = itemTotals.reduce((s, t) => s + t.totalGoodsAmount, 0);
    const totalGoodsCostVnd = itemTotals.reduce((s, t) => s + t.totalGoodsCostVnd, 0);
    const domestic = parseFloat(header.domesticShippingVnd) || 0;
    const intlManual = parseFloat(header.intlShippingVnd) || 0;
    const intlUnitPrice = parseFloat(header.internationalShippingUnitPriceVnd) || 0;
    const measurement = parseFloat(String(header.packageMeasurement || '').replace(',', '.')) || 0;
    const intl = intlManual > 0 ? intlManual : intlUnitPrice * measurement;
    const fee = parseFloat(header.orderFeeVnd) || 0;
    const delivery = parseFloat(header.localDeliveryFeeVnd) || 0;
    const deposit = parseFloat(header.depositVnd) || 0;
    const totalCost = totalGoodsCostVnd + domestic + intl + fee + delivery;
    return {
      items: itemTotals, totalQty, totalGoodsAmount, totalGoodsCostVnd,
      intlShippingVnd: Math.round(intl), totalLotCostVnd: Math.round(totalCost),
      unitCostFullVnd: totalQty > 0 ? (totalCost / totalQty).toFixed(2) : '0.00',
      remainingPaymentVnd: Math.round(totalCost - deposit)
    };
  }, [items, header]);

  const resetItemForm = () => {
    setItemForm({ ...emptyItemForm });
    setFormVariants([{ name: '', qty: '' }]);
    setEditingIndex(null);
  };

  const addOrUpdateItem = () => {
    if (!itemForm.productName) { setError('Thiếu tên sản phẩm.'); return; }

    const totalQty = calcTotalQty(formVariants);
    if (totalQty <= 0) { setError('Thiếu số lượng cho biến thể.'); return; }
    if (!itemForm.unitPrice || parseFloat(itemForm.unitPrice) <= 0) { setError('Thiếu đơn giá.'); return; }

    const itemPayload = {
      ...itemForm,
      spec: JSON.stringify(formVariants),
      orderedQty: totalQty
    };

    if (editingIndex !== null) {
      setItems(prev => prev.map((item, i) => i === editingIndex ? itemPayload : item));
    } else {
      setItems(prev => [...prev, itemPayload]);
    }
    resetItemForm();
    setError('');
  };

  const editItem = (index) => {
    const item = items[index];
    setItemForm({ ...item });
    setFormVariants(parseVariants(item.spec));
    setEditingIndex(index);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setItemForm({ ...emptyItemForm });
      setFormVariants([{ name: '', qty: '' }]);
      setEditingIndex(null);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (id && loadingOrder) { setError('Đang tải thông tin đơn hàng, vui lòng thử lại sau.'); return; }
    if (items.length === 0) { setError('Danh sách sản phẩm trống — thêm ít nhất 1 sản phẩm.'); return; }
    setLoading(true);
    setError('');
    try {
       const itemList = items.map(item => ({
          productName: item.productName, posCode: item.posCode,
          spec: item.spec, orderedQty: parseInt(item.orderedQty, 10) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          currency: item.currency, exchangeRate: parseFloat(item.exchangeRate) || 1,
          country: item.country, shippingMethod: item.shippingMethod,
          priority: item.priority || 'NORMAL',
          productType: item.productType || 'NEW',
          department: item.department || '',
          weightedAvgCostVnd: item.weightedAvgCostVnd ? parseFloat(item.weightedAvgCostVnd) : null,
          latestUnitCostVnd: item.latestUnitCostVnd ? parseFloat(item.latestUnitCostVnd) : null,
          latestOrderCode: item.latestOrderCode || null,
          latestCostDate: item.latestCostDate || null
       }));
      const submitData = {
        ...header, items: itemList, sourcePlanId,
        intlShippingVnd: calculated.intlShippingVnd,
        totalGoodsAmount: calculated.totalGoodsAmount,
        totalGoodsCostVnd: calculated.totalGoodsCostVnd,
        totalLotCostVnd: calculated.totalLotCostVnd,
        unitCostFullVnd: calculated.unitCostFullVnd,
        remainingPaymentVnd: calculated.remainingPaymentVnd
      };
      if (id) { await purchaseOrderAPI.update(id, submitData); navigate('/purchase-orders'); }
      else {
        await purchaseOrderAPI.create(submitData);
        setSuccessMessage('Đã tạo đơn hàng và gửi cho Admin duyệt');
        setTimeout(() => navigate('/purchase-orders'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const openProduct = (posCode) => {
    if (!posCode) return;
    navigate('/products', { state: { search: posCode } });
  };

  const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{id ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng mới'}</h1>
          <p className="page-subtitle">Nhập sản phẩm → Thêm vào danh sách → Nhập thông tin chung → Lưu đơn</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>Hủy</button>
          <button type="submit" form="po-form" className="btn btn-primary" disabled={loading || loadingOrder || items.length === 0}>
            {loading ? 'Đang lưu...' : id && status === 'REJECTED' ? 'Cập nhật & gửi duyệt lại' : id ? 'Cập nhật' : 'Tạo đơn'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}
        {successMessage ? <div className="success-message">{successMessage}</div> : null}

        <form id="po-form" className="app-form purchase-order-form" onSubmit={handleSubmit}>
          <fieldset className="po-section">
            <legend>Nhập thông tin sản phẩm</legend>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Chọn sản phẩm <span className="required">*</span></label>
                <PosCodeSelector value={itemForm.posCode}
                  onChange={(v) => setItemForm(f => ({ ...f, posCode: v }))}
                  onProductSelect={(p) => {
                    const cost = costMap[p.posCode];
                    setItemForm(f => ({
                      ...f, posCode: p.posCode, productName: p.productName, spec: p.spec || f.spec,
                      weightedAvgCostVnd: cost?.weightedAvgCostVnd ?? '',
                      latestUnitCostVnd: cost?.latestUnitCostVnd ?? '',
                      latestOrderCode: cost?.latestOrderCode ?? '',
                      latestCostDate: cost?.latestCostDate ?? ''
                    }));
                    if (p.spec) {
                      const parsed = parseVariants(p.spec);
                      if (parsed.some(v => v.name)) {
                        const filled = parsed.map(v => ({ ...v, qty: v.qty || '1' }));
                        setFormVariants(filled);
                      }
                    } else {
                      setFormVariants([{ name: '', qty: '1' }]);
                    }
                  }} />
              </div>
              <div className="form-group">
                <label>Tên sản phẩm <span className="required">*</span></label>
                <input value={itemForm.productName}
                  onChange={(e) => setItemForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
            </div>

            <div className="form-row cols-4">
              <div className="form-group">
                <label>SL đặt <span className="required">*</span></label>
                <input type="number" value={calcTotalQty(formVariants) || ''} readOnly
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label>Đơn giá ({itemForm.currency}) <span className="required">*</span></label>
                <input type="number" value={itemForm.unitPrice}
                  onChange={(e) => setItemForm(f => ({ ...f, unitPrice: e.target.value.replace(/[^0-9.,-]/g, '') }))} step="0.01" />
              </div>
              <div className="form-group">
                <label>Tiền tệ</label>
                <select value={itemForm.currency}
                  onChange={(e) => {
                    const c = e.target.value;
                    setItemForm(f => ({ ...f, currency: c, exchangeRate: exchangeRates[c] ? String(exchangeRates[c]) : f.exchangeRate }));
                  }}>
                  <option value="CNY">CNY</option>
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tỷ giá</label>
                  <input type="number" value={itemForm.exchangeRate}
                   onChange={(e) => setItemForm(f => ({ ...f, exchangeRate: e.target.value.replace(/[^0-9.,-]/g, '') }))}
                   step="0.0001" />
              </div>
            </div>

            <div className="form-row" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 300 }}>
                <label>Biến thể & Số lượng</label>
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

             <div className="form-row">
               <div className="form-group">
                 <label>Nguồn nhập</label>
                 <select value={itemForm.country}
                   onChange={(e) => setItemForm(f => ({ ...f, country: e.target.value }))}>
                   <option value="Trung Quốc">Trung Quốc</option>
                   <option value="Việt Nam">Việt Nam</option>
                   <option value="Khác">Khác</option>
                 </select>
               </div>
               <div className="form-group">
                 <label>Hình thức VC</label>
                  <select value={itemForm.shippingMethod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemForm(f => ({ ...f, shippingMethod: val }));
                      setHeader(prev => ({ ...prev, shippingMethod: val }));
                    }}>
                     <option value="SEA PHI">SEA PHI</option>
                     <option value="AIR PHI">AIR PHI</option>
                     <option value="SEA MALAY">SEA MALAY</option>
                     <option value="AIR MALAY">AIR MALAY</option>
                     <option value="SEA">SEA</option>
                     <option value="LALAMOVE">LALAMOVE</option>
                     <option value="SHOPEE PHI">SHOPEE PHI</option>
                     <option value="EXPRESS">EXPRESS</option>
                     <option value="Đi hàng">Đi hàng</option>
                     <option value="OTHER">OTHER</option>
                 </select>
               </div>
               <div className="form-group">
                 <label>Ưu tiên</label>
                 <select value={itemForm.priority}
                   onChange={(e) => setItemForm(f => ({ ...f, priority: e.target.value }))}>
                   <option value="NORMAL">Thường</option>
                   <option value="HIGH">Cao</option>
                   <option value="URGENT">Khẩn cấp</option>
                 </select>
               </div>
                <div className="form-group">
                  <label>Quy cách</label>
                  <input value={itemForm.spec}
                    onChange={(e) => setItemForm(f => ({ ...f, spec: e.target.value }))}
                    placeholder="VD: Hộp 10 cái" />
                </div>
              </div>

              {(() => {
                const isOldItem = itemForm.posCode && costMap[itemForm.posCode]?.weightedAvgCostVnd != null && Number(costMap[itemForm.posCode].weightedAvgCostVnd) > 0;
                if (!isOldItem) return null;
                return (
                  <div className="form-row cols-2" style={{ marginTop: 8, padding: '10px 12px', background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div className="form-group">
                      <label style={{ fontSize: 12, color: '#b45309' }}>Giá vốn trung bình (VNĐ)</label>
                      <input type="text" value={itemForm.weightedAvgCostVnd ?? ''}
                        onChange={e => setItemForm(f => ({ ...f, weightedAvgCostVnd: e.target.value }))}
                        placeholder="Nhập giá vốn TB từ các đơn khác" />
                      <p className="muted-copy" style={{ fontSize: 10, margin: 0 }}>Giá của SP này trong các đơn hàng khác</p>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 12, color: '#b45309' }}>Giá vốn gần nhất (VNĐ)</label>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="text" value={itemForm.latestUnitCostVnd ?? ''}
                          onChange={e => setItemForm(f => ({ ...f, latestUnitCostVnd: e.target.value }))}
                          placeholder="0" style={{ flex: 1 }} />
                        {itemForm.latestOrderCode && (
                          <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{itemForm.latestOrderCode}</span>
                        )}
                        {itemForm.latestCostDate && (
                          <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(itemForm.latestCostDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="muted-copy" style={{ fontSize: 10, margin: 0 }}>Giá + mã đơn + thời gian gần nhất</p>
                    </div>
                  </div>
                );
              })()}

            <div className="form-actions" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={addOrUpdateItem}>
                {editingIndex !== null ? `Cập nhật sản phẩm #${editingIndex + 1}` : 'Thêm vào danh sách'}
              </button>
              {editingIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={resetItemForm}>Hủy chỉnh sửa</button>
              )}
            </div>
          </fieldset>

          <fieldset className="po-section">
            <legend>Danh sách sản phẩm ({items.length})</legend>
            {items.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                Chưa có sản phẩm. Nhập thông tin phía trên và nhấn "Thêm vào danh sách".
              </div>
            ) : (
              <div className="table-card">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 150 }}>Tên SP</th>
                        <th style={{ width: 95 }}>Mã POS</th>
                        <th style={{ width: 55 }}>Loại</th>
                        <th style={{ width: 80 }}>Chi tiết</th>
                        <th style={{ width: 45 }}>SL</th>
                        <th style={{ width: 85 }}>Đơn giá (NT)</th>
                        <th style={{ width: 50 }}>TG</th>
                        <th style={{ width: 100 }}>Thành tiền (NT)</th>
                        <th style={{ width: 80 }}>Quy đổi VNĐ</th>
                        <th style={{ width: 100 }}>Giá vốn TB</th>
                        <th style={{ width: 125 }}>Giá vốn gần nhất</th>
                        <th style={{ width: 115 }}>Chênh lệch GV</th>
                        <th style={{ width: 100 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.flatMap((item, index) => {
                        const itemVariants = parseVariants(item.spec);
                        const hasVariants = itemVariants.some(v => v.name || v.qty);
                        const sub = (parseFloat(item.unitPrice) || 0) * (parseInt(item.orderedQty, 10) || 0);
                        const vnd = Math.round(sub * (parseFloat(item.exchangeRate) || 1));
                        const rows = [];
                        rows.push(
                          <tr key={index} className={editingIndex === index ? 'row-editing' : ''}>
                            <td>{index + 1}</td>
                            <td>{getName(item)}</td>
                            <td>{item.posCode ? (
                              <a href="#"
                                onClick={(e) => { e.preventDefault(); openProduct(item.posCode); }}
                                style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                                {item.posCode}
                              </a>
                            ) : '-'}</td>
                              <td>
                                {item.productType === 'USED'
                                  ? <span style={{ color: '#b45309', fontWeight: 600, fontSize: 12 }}>Hàng cũ</span>
                                  : <span style={{ color: '#6b7280', fontSize: 12 }}>Hàng mới</span>
                                }
                              </td>
                              <td style={{ fontSize: 13, color: '#475569', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}
                              </td>
                              <td>{item.orderedQty}</td>
                            <td>{Number(item.unitPrice || 0).toLocaleString()} {item.currency}</td>
                            <td>{item.exchangeRate}</td>
                            <td>{sub.toLocaleString()} {item.currency}</td>
                            <td className="money">{formatVnd(vnd)}</td>
                            <td>
                              {item.posCode && costMap[item.posCode]?.weightedAvgCostVnd
                                ? formatVnd(costMap[item.posCode].weightedAvgCostVnd)
                                : <span className="muted-copy">—</span>}
                            </td>
                            <td>
                              {item.posCode && costMap[item.posCode]?.latestUnitCostVnd ? (
                                <span style={{ fontSize: 11 }}>
                                  <div style={{ fontWeight: 600 }}>{formatVnd(costMap[item.posCode].latestUnitCostVnd)}</div>
                                  {costMap[item.posCode].latestOrderCode && (
                                    <span style={{ color: '#64748b' }}>{costMap[item.posCode].latestOrderCode}</span>
                                  )}
                                  {costMap[item.posCode].latestCostDate && (
                                    <span style={{ color: '#94a3b8' }}>
                                      {' '}{new Date(costMap[item.posCode].latestCostDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </span>
                              ) : <span className="muted-copy">—</span>}
                            </td>
                            <td>
                              {(() => {
                                if (!item.posCode) return <span className="muted-copy">—</span>;
                                const prevCost = costMap[item.posCode]?.weightedAvgCostVnd;
                                if (prevCost == null || Number(prevCost) === 0) return <span className="muted-copy">—</span>;
                                const perUnitVnd = (Number(item.unitPrice) || 0) * (Number(item.exchangeRate) || 1);
                                const diff = perUnitVnd - Number(prevCost);
                                const pct = (diff / Number(prevCost)) * 100;
                                const color = Math.abs(pct) < 5 ? '#16a34a' : pct > 0 ? '#dc2626' : '#2563eb';
                                return (
                                  <span style={{ color, fontWeight: 600, fontSize: 12 }}>
                                    {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                                  </span>
                                );
                              })()}
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
                                <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                                <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
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
              </div>
            )}
          </fieldset>

          <fieldset className="po-section">
            <legend>Thông tin chung</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Nhà cung cấp</label>
                <input type="text" name="supplierName" value={header.supplierName} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>Ngày đặt hàng</label>
                <input type="date" name="orderDate" value={header.orderDate} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>Landing page</label>
                <input type="text" name="landing" value={header.landing} onChange={handleHeaderChange} placeholder="VD: https://..." />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phòng ban thực hiện</label>
                {sourcePlanId ? (
                  <input className="calculated-input" type="text" value={header.initiatorDepartment || ''} readOnly />
                ) : (
                  <input type="text" name="initiatorDepartment" value={header.initiatorDepartment}
                    onChange={handleHeaderChange} placeholder="VD: KD1, PKD2..." />
                )}
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <input className="calculated-input" type="text" value={status} readOnly />
              </div>
              {sourcePlanId && (
              <div className="form-group">
                <label>Nguồn kế hoạch</label>
                <div style={{ paddingTop: 6 }}>
                  <a href={`/weekly-plans?search=${encodeURIComponent(`KH-${String(sourcePlanId).padStart(4, '0')}`)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/weekly-plans', { state: { search: `KH-${String(sourcePlanId).padStart(4, '0')}` } });
                    }}
                    style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                    KH-{String(sourcePlanId).padStart(4, '0')}
                  </a>
                </div>
              </div>
              )}
            </div>
          </fieldset>

          {status === 'IN_TRANSIT' && (
          <fieldset className="po-section">
            <legend>Chi phí vận chuyển quốc tế</legend>
            <div className="form-row cols-3">
              <div className="form-group">
                <label>VC nội địa</label>
                <input type="number" name="domesticShippingVnd" value={header.domesticShippingVnd} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>VC quốc tế</label>
                <input className="calculated-input" type="number" value={calculated.intlShippingVnd} readOnly />
              </div>
              <div className="form-group">
                <label>Phí đặt hàng</label>
                <input type="number" name="orderFeeVnd" value={header.orderFeeVnd} onChange={handleHeaderChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Đơn giá VC QT (đ/kg)</label>
                <input type="number" name="internationalShippingUnitPriceVnd" value={header.internationalShippingUnitPriceVnd} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>Khối lượng / Thể tích</label>
                <input type="text" name="packageMeasurement" value={header.packageMeasurement} onChange={handleHeaderChange} placeholder="VD: 68 kg" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phí giao hàng địa phương</label>
                <input type="number" name="localDeliveryFeeVnd" value={header.localDeliveryFeeVnd} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>Ngày TT cước VC</label>
                <input type="date" name="freightPaymentDate" value={header.freightPaymentDate} onChange={handleHeaderChange} />
              </div>
            </div>
          </fieldset>
          )}

          <fieldset className="po-section">
            <legend>Tổng hợp & giá vốn</legend>
            <div className="po-cost-panel">
              <div className="po-total">
                <span>Tổng tiền lô (VNĐ)</span>
                <strong>{formatVnd(calculated.totalLotCostVnd)}</strong>
                <small>{items.length} sản phẩm — tổng {calculated.totalQty} cái</small>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>GV đầy đủ 1 SP (VNĐ)</label>
                <input className="calculated-input" type="text"
                  value={`${Number(calculated.unitCostFullVnd || 0).toLocaleString('vi-VN')} đ/pcs`} readOnly />
              </div>
              <div className="form-group">
                <label>Phương thức thanh toán</label>
                <select name="paymentMethod" value={header.paymentMethod} onChange={handleHeaderChange}>
                  <option value="CNY qua CK bank">CNY qua CK bank</option>
                  <option value="USD qua CK bank">USD qua CK bank</option>
                  <option value="VND">VND</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Đã cọc</label>
                <input type="number" name="depositVnd" value={header.depositVnd} onChange={handleHeaderChange} />
              </div>
              <div className="form-group">
                <label>Còn phải TT (VNĐ)</label>
                <input className="calculated-input" type="text" value={formatVnd(calculated.remainingPaymentVnd)} readOnly />
              </div>
            </div>
          </fieldset>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="note" value={header.note} onChange={handleHeaderChange} rows={3} />
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseOrderNew;


