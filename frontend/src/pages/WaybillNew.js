import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { waybillAPI, purchaseOrderAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { canCrudWaybill, canUpdateWaybillStatus, getUser } from '../utils/permissions';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ vận chuyển' },
  { value: 'IN_TRANSIT', label: 'Đang vận chuyển' },
  { value: 'WAITING_DELIVERY', label: 'Chờ giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]));

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

const formatRoundedThousands = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(value / 1000) * 1000;
};

function WaybillNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const userData = getUser();
  const canCrud = canCrudWaybill(userData);
  const canUpdateStatus = canUpdateWaybillStatus(userData);

  const [orders, setOrders] = useState([]);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');


const [form, setForm] = useState({
     waybillCode: '', carrier: '', status: 'IN_TRANSIT',
     origin: '', destination: '',
     actualQty: '',
     note: '',
     freightVnd: ''
   });

const computedFreightVnd = useMemo(() => {
     return products.reduce((sum, p) => {
       const rate = Number(p.exchangeRate || 3520);
       const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
       return sum + (cny * rate);
     }, 0);
   }, [products]);

   // Keep form freightVnd in sync with computed value
    useEffect(() => {
      const newFreightVnd = computedFreightVnd !== undefined && !Number.isNaN(computedFreightVnd) && computedFreightVnd > 0
        ? computedFreightVnd
        : form.freightVnd;
      if (newFreightVnd !== form.freightVnd) {
        setForm(prev => ({ ...prev, freightVnd: newFreightVnd }));
      }
    }, [computedFreightVnd, form.freightVnd]);

   const computedExpectedQty = useMemo(() => {
     return products.reduce((sum, p) => sum + (Number(p.packageCount) || 0), 0);
   }, [products]);

const updateProductField = (idx, field, value) => {
     if (['volume', 'unitPriceVC', 'exchangeRate', 'manualTotalCny'].includes(field)) {
       const oldP = products[idx];
       const updatedP = { ...oldP, [field]: value };
       const { totalCny, manualTotalCny: newManualTotalCny, totalVnd } = calculateProductFreight(updatedP);
       setProducts(prev => prev.map((p, i) => i === idx ? { ...updatedP, totalCny, manualTotalCny: newManualTotalCny, totalVnd } : p));
     } else {
       setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
     }
   };

  useEffect(() => {
    const fromPOItems = location.state?.fromPOItems;
    if (fromPOItems && fromPOItems.length > 0) {
const mapped = fromPOItems.map((item, i) => ({
         _itemId: `from-po-${i}`,
         poId: item.poId,
         poCode: item.poCode,
         posCode: item.posCode || '',
         productName: item.productName || '',
         spec: item.spec || '',
         orderedQty: String(item.orderedQty || ''),
         unitPrice: String(item.unitPrice || ''),
         currency: item.currency || 'CNY',
         exchangeRate: String(item.exchangeRate || '3520'),
         volume: item.volume || '',
         unitPriceVC: item.unitPriceVC || '',
         packageCount: item.packageCount || String(item.orderedQty || ''),
         shippingMethod: item.shippingMethod || '',
         purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,
         manualTotalCny: undefined,
         totalCny: 0,
         totalVnd: 0,
       }));
      setProducts(mapped);
    }
    window.history.replaceState({}, document.title);
  }, []);

  useEffect(() => {
    purchaseOrderAPI.getAll('', 0, 10000).then(data => {
      const allOrders = data.orders || [];
      setOrders(allOrders.filter(o =>
        ['APPROVED', 'SENT_TO_ACCOUNTING', 'SHIPPING', 'IN_TRANSIT', 'COMPLETED', 'PAID'].includes(o?.status)
      ));
    }).catch(() => {});
  }, []);

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
          actualQty: data.actualQty ?? '',
          note: data.note || '',
          freightVnd: data.freightVnd ?? ''
        });
        if (data.products) {
          try {
            let parsed = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
if (Array.isArray(parsed)) {
               const productsWithMissingShipping = parsed.filter(p => !p.shippingMethod && p.poId);
               const poIds = [...new Set(productsWithMissingShipping.map(p => p.poId))];
               if (poIds.length > 0) {
                 const poPromises = poIds.map(poId => purchaseOrderAPI.getById(poId).catch(() => null));
                 const poResults = await Promise.all(poPromises);
                 const poShippingMap = {};
                 poResults.filter(Boolean).forEach(po => { poShippingMap[po.id] = po.shippingMethod || ''; });
                 parsed = parsed.map(p => ({
                   ...p,
                   shippingMethod: p.shippingMethod || poShippingMap[p.poId] || ''
                 }));
               }
               const updatedProducts = parsed.map(p => {
                 const { totalCny, totalVnd } = calculateProductFreight(p);
                 return { ...p, totalCny, totalVnd };
               });
               setProducts(updatedProducts);
             }
          } catch {}
        }
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (!canCrud) {
    return (
      <div className="page-screen">
        <div className="page-content">
          <div className="error-message">Bạn không có quyền tạo hoặc sửa vận đơn.</div>
        </div>
      </div>
    );
  }

  const addPO = (poId) => {
    if (!poId) return;
    if (selectedPOs.some(o => String(o.id) === poId)) return;
    const order = orders.find(o => String(o.id) === poId);
    if (!order) return;
    setSelectedPOs(prev => [...prev, order]);
    if (order.items && order.items.length > 0) {
      const mapped = order.items.map((item, idx) => ({
        id: `${order.id}-${idx}`,
        purchaseOrderItemId: item.id,
        poId: order.id,
        poCode: order.poCode || 'PO-' + order.id,
        posCode: item.posCode || '',
        productName: item.productName || '',
        spec: item.spec || '',
        orderedQty: String(item.orderedQty || ''),
        unitPrice: String(item.unitPrice || ''),
        currency: item.currency || 'CNY',
        exchangeRate: String(item.exchangeRate || '3520'),
        shippingMethod: item.shippingMethod || '',
        totalAmountForeign: item.totalAmountForeign || (Number(item.unitPrice || 0) * Number(item.orderedQty || 0)),
        totalAmountVnd: item.totalAmountVnd || 0,
      }));
      setAvailableItems(prev => [...prev, ...mapped]);
    }
  };

  const removePO = (poId) => {
    setSelectedPOs(prev => prev.filter(o => o.id !== poId));
    setAvailableItems(prev => prev.filter(item => item.poId !== poId));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      availableItems.filter(item => item.poId === poId).forEach(item => next.delete(item.id));
      return next;
    });
    setProducts(prev => prev.filter(p => p.poId !== poId));
  };

  const toggleItem = (itemId) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

const addSelectedItems = () => {
     const newProducts = [];
     selectedItemIds.forEach(id => {
       const item = availableItems.find(i => i.id === id);
       if (item && !products.some(p => p._itemId === id)) {
         newProducts.push({
           _itemId: id,
           purchaseOrderItemId: item.purchaseOrderItemId,
           poId: item.poId,
           poCode: item.poCode,
           posCode: item.posCode,
           productName: item.productName,
           spec: item.spec,
           orderedQty: item.orderedQty,
           unitPrice: item.unitPrice,
           currency: item.currency,
           exchangeRate: item.exchangeRate,
           volume: '',
           unitPriceVC: '',
           packageCount: item.orderedQty,
           shippingMethod: item.shippingMethod || '',
           manualTotalCny: undefined,
           totalCny: 0,
           totalVnd: 0,
         });
       }
     });
     if (newProducts.length > 0) {
       setProducts(prev => {
         const updated = [...prev, ...newProducts];
         return updated.map(p => ({
           ...p,
           totalCny: calculateProductFreight(p).totalCny,
           totalVnd: calculateProductFreight(p).totalVnd,
         }));
       });
     }
     setSelectedItemIds(new Set());
   };

  const removeProduct = (idx) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateProductFreight = (p) => {
     const totalCny = (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0);
     const manualTotalCny = p.manualTotalCny !== undefined && p.manualTotalCny !== '' ? Number(p.manualTotalCny || 0) : totalCny;
     const totalVnd = Math.round(manualTotalCny * (Number(p.exchangeRate) || 3520));
     return { totalCny, manualTotalCny, totalVnd };
   };

const handleVolumeChange = (idx, newVal) => {
     const num = Number(newVal);
     if (isNaN(num)) return;

     setProducts(prev => {
       const updatedProducts = prev.map((p, i) => {
         if (i === idx) {
           const updatedP = { ...p, volume: newVal };
           const { totalCny, manualTotalCny, totalVnd } = calculateProductFreight(updatedP);
           return { ...updatedP, volume: newVal, totalCny, manualTotalCny, totalVnd };
         }
         return p;
       });
       return updatedProducts;
     });
   };

   const handleUnitPriceVCChange = (idx, newVal) => {
     const num = Number(newVal);
     if (isNaN(num)) return;

     setProducts(prev => {
       const updatedProducts = prev.map((p, i) => {
         if (i === idx) {
           const updatedP = { ...p, unitPriceVC: newVal };
           const { totalCny, manualTotalCny, totalVnd } = calculateProductFreight(updatedP);
           return { ...updatedP, unitPriceVC: newVal, totalCny, manualTotalCny, totalVnd };
         }
         return p;
       });
       return updatedProducts;
     });
   };

   const handleManualTotalCnyChange = (idx, newVal) => {
     const num = Number(newVal);
     if (isNaN(num)) return;

     setProducts(prev => {
       const updatedProducts = prev.map((p, i) => {
         if (i === idx) {
           const updatedP = { ...p, manualTotalCny: newVal };
           const { totalCny, manualTotalCny: newManualTotalCny, totalVnd } = calculateProductFreight(updatedP);
           return { ...updatedP, manualTotalCny: newVal, totalCny: newManualTotalCny, totalVnd };
         }
         return p;
       });
       return updatedProducts;
     });
   };

   const handleExchangeRateChange = (idx, newVal) => {
     const num = Number(newVal);
     if (isNaN(num)) return;

     setProducts(prev => {
       const updatedProducts = prev.map((p, i) => {
         if (i === idx) {
           const updatedP = { ...p, exchangeRate: newVal };
           const { totalCny, manualTotalCny, totalVnd } = calculateProductFreight(updatedP);
           return { ...updatedP, exchangeRate: newVal, totalCny, manualTotalCny, totalVnd };
         }
         return p;
       });
       return updatedProducts;
     });
   };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const normalizeFreightVnd = (value) => {
    if (value === '' || value == null) return null;
    return Number(value);
  };

  const freightVndValue = computedFreightVnd || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (products.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm từ đơn hàng.');
      return;
    }
    setLoading(true);
    setError('');
    const productsPayload = products.map(p => ({
      poId: p.poId,
      poCode: p.poCode,
      posCode: p.posCode,
      productName: p.productName,
      spec: p.spec,
      orderedQty: p.orderedQty,
      unitPrice: p.unitPrice,
      currency: p.currency,
      exchangeRate: p.exchangeRate,
      volume: p.volume || '',
      unitPriceVC: p.unitPriceVC || '',
      manualTotalCny: undefined, // Don't send manualTotalCny, let backend calculate
      packageCount: p.packageCount || '',
      shippingMethod: p.shippingMethod || '',
      purchaseOrderItemId: p.purchaseOrderItemId || null,
    }));
    const payload = {
      ...form,
      expectedQty: computedExpectedQty || null,
      actualQty: form.actualQty ? Number(form.actualQty) : null,
      freightVnd: normalizeFreightVnd(freightVndValue),
      products: JSON.stringify(productsPayload)
    };
    try {
      if (isEdit) {
        await waybillAPI.update(id, payload);
        navigate(`/waybills/${id}`);
      } else {
        const created = await waybillAPI.create(payload);
        console.log('[WaybillNew] Created waybill response:', created);
        // Calculate freightVnd for each product and update UI
        if (created.products && created.freightVnd) {
          try {
            const parsedProducts = typeof created.products === 'string' ? JSON.parse(created.products) : created.products;
            console.log('[WaybillNew] Parsed products from backend:', parsedProducts);
            
            // Backend đã tính freightVnd cho mỗi product, áp dụng vào products
            const totalFreight = created.freightVnd;
            console.log('[WaybillNew] Total freight from backend:', totalFreight);
            
            setProducts(prev => prev.map((p, idx) => {
              const parsedP = parsedProducts[idx];
              console.log(`[WaybillNew] Product ${idx} (${p.productName || 'N/A'}):`, { parsedP, current: p });
              
              if (Array.isArray(parsedProducts) && parsedP) {
                // Always update with freightVnd from backend (even if 0)
                const newP = { 
                  ...p, 
                  freightVnd: parsedP.freightVnd !== undefined ? parsedP.freightVnd : null 
                };
                console.log(`[WaybillNew] Updating product ${idx} to freightVnd: ${newP.freightVnd}`);
                return newP;
              }
              return p;
            }));
            console.log('[WaybillNew] Products updated with freightVnd from backend');
          } catch (err) {
            console.error('[WaybillNew] Failed to update products with freightVnd:', err);
          }
        }
        
        navigate(`/waybills/${created.id}`);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const orderOptions = orders.map(order => ({
    value: String(order.id),
    label: `${order.poCode || 'PO-' + order.id} · ${order.supplierName || order.posCode || 'N/A'}`
  }));

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{isEdit ? 'Cập nhật vận đơn' : 'Tạo vận đơn mới'}</h1>
          <p className="page-subtitle">Waybill — chọn sản phẩm từ nhiều đơn hàng để gộp vào một vận đơn</p>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Mã vận đơn <span className="required">*</span></label>
              <input name="waybillCode" value={form.waybillCode} onChange={handleChange} placeholder="Nhập mã vận đơn..." required />
            </div>
            <div className="form-group">
              <label>Đơn vị vận chuyển <span className="required">*</span></label>
              <input name="carrier" value={form.carrier} onChange={handleChange} placeholder="VD: DHL, FedEx" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Trạng thái</label>
              {canUpdateStatus ? (
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="PENDING">Chờ vận chuyển</option>
                  <option value="IN_TRANSIT">Đang vận chuyển</option>
                  <option value="WAITING_DELIVERY">Chờ giao hàng</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              ) : (
                <div className={`badge badge-${(form.status || '').toLowerCase()}`}>
                  {STATUS_MAP[form.status] || form.status || '-'}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Địa chỉ gửi</label>
              <input name="origin" value={form.origin} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Địa chỉ nhận</label>
              <input name="destination" value={form.destination} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tổng số kiện <span className="required">*</span></label>
              <input type="number" value={computedExpectedQty || ''} readOnly
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }} required />
            </div>
            <div className="form-group">
              <label>Tổng cước VC (VNĐ)</label>
<span style={{ display: 'block', padding: '3px 4px', background: '#f8fafc', textAlign: 'right' }}>{(freightVndValue || 0).toLocaleString('vi-VN')} VND</span>
              <small className="muted-copy">Gợi ý tự tính: {(computedFreightVnd || 0).toLocaleString('vi-VN')} VNĐ</small>
            </div>
            <div className="form-group">
              <label>SL thực tế</label>
              <input type="number" name="actualQty" value={form.actualQty} onChange={handleChange} placeholder="0" />
            </div>
          </div>

          <fieldset style={{ marginTop: 20 }}>
            <legend>Chọn đơn hàng (PO) và sản phẩm</legend>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <select
                style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}
                value="" onChange={e => addPO(e.target.value)}
              >
                <option value="">-- Chọn đơn hàng --</option>
                {orderOptions
                  .filter(opt => !selectedPOs.some(o => String(o.id) === opt.value))
                  .map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
              </select>
            </div>

            {selectedPOs.length > 0 && (
              <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}><input type="checkbox" checked={availableItems.length > 0 && selectedItemIds.size === availableItems.length}
                        onChange={() => {
                          if (selectedItemIds.size === availableItems.length) setSelectedItemIds(new Set());
                          else setSelectedItemIds(new Set(availableItems.map(i => i.id)));
                        }} /></th>
                      <th>PO</th>
                      <th>Mã POS</th>
                      <th>Sản phẩm</th>
                      <th>Chi tiết</th>
                      <th style={{ width: 50 }}>SL</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableItems.map((item) => (
                      <tr key={item.id}>
                        <td><input type="checkbox" checked={selectedItemIds.has(item.id)} onChange={() => toggleItem(item.id)} /></td>
                        <td style={{ fontSize: 12 }}>{item.poCode}</td>
                        <td style={{ fontSize: 12 }}>{item.posCode}</td>
                        <td style={{ fontSize: 12 }}>{item.productName}</td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{item.spec || '-'}</td>
                        <td>{item.orderedQty}</td>
                        <td>
                          <button type="button" onClick={() => removePO(item.poId)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
                            title="Xóa PO này">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button type="button" className="btn btn-primary" onClick={addSelectedItems}
              disabled={selectedItemIds.size === 0}>
              ADD ({selectedItemIds.size}) sản phẩm vào vận đơn
            </button>
          </fieldset>

          <fieldset style={{ marginTop: 12 }}>
            <legend>Danh sách sản phẩm trong vận đơn ({products.length})</legend>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: 13 }}>
                Chưa có sản phẩm. Chọn đơn hàng và tích sản phẩm phía trên.
              </div>
            ) : (
              <div className="table-wrapper">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: 12, minWidth: 900 }}>
                    <thead>
<tr>
                         <th style={{ textAlign: 'left', padding: '2px' }}>STT</th>
                         <th style={{ textAlign: 'left', padding: '2px' }}>Tên sản phẩm</th>
                         <th style={{ textAlign: 'center', padding: '2px', width: 30 }}>Số lượng</th>
                         <th style={{ textAlign: 'center', padding: '2px' }}>KL/T.tích</th>
                         <th style={{ textAlign: 'right', padding: '2px' }}>Đơn giá VC</th>
                         <th style={{ textAlign: 'right', padding: '2px' }}>Tổng cước</th>
                         <th style={{ textAlign: 'center', padding: '2px' }}>Tỷ giá</th>
                         <th style={{ textAlign: 'right', padding: '2px' }}>Cước VC (VNĐ)</th>
                         <th style={{ textAlign: 'center', padding: '2px' }}>Số kiện</th>
                         <th style={{ textAlign: 'center', padding: '2px' }}>H.Thức VC</th>
                         <th style={{ width: 35 }}></th>
                       </tr>
                    </thead>
<tbody>
{products.map((p, idx) => {
    const productKey = p._itemId || p.id || `product-${idx}`;
    const calculateValues = () => {
      const volumeVal = Number(p.volume) || 0;
      const unitPriceVCVal = Number(p.unitPriceVC) || 0;
      const manualTotalCnyVal = p.manualTotalCny !== undefined && p.manualTotalCny !== '' ? Number(p.manualTotalCny || 0) : (volumeVal * unitPriceVCVal);
      const exchangeRateVal = Number(p.exchangeRate) || 3520;
      return {
        totalCny: volumeVal * unitPriceVCVal,
        manualTotalCny: manualTotalCnyVal,
        totalVnd: Math.round(manualTotalCnyVal * exchangeRateVal)
      };
    };
    
    const values = calculateValues();
    return (
    <tr key={productKey}>
     <td>{idx + 1}</td>
     <td>{p.productName}{p.posCode ? ` (${p.posCode})` : ''}</td>
     <td>{p.orderedQty}</td>
     <td>
       <input type="number" step="0.01" value={p.volume || ''}
         onChange={e => handleVolumeChange(idx, e.target.value)}
         style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
     </td>
<td>
                              <input type="number" step="0.01" value={p.unitPriceVC || ''}
                                onChange={e => handleUnitPriceVCChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                              </td>
     <td>
       <input type="number" step="0.01" value={p.manualTotalCny !== undefined && p.manualTotalCny !== '' ? p.manualTotalCny : (totalCny || '')}
         onChange={e => handleManualTotalCnyChange(idx, e.target.value)}
         style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
     </td>
     <td>
       <input type="number" step="1" value={p.exchangeRate || ''}
         onChange={e => handleExchangeRateChange(idx, e.target.value)}
         style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
     </td>
     <td style={{ fontWeight: 600, textAlign: 'right' }}>{values.totalVnd.toLocaleString('vi-VN')} ₫</td>
     <td>
       <input type="number" value={p.packageCount || ''}
         onChange={e => updateProductField(idx, 'packageCount', e.target.value)}
         style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
     </td>
     <td>{p.shippingMethod || ''}</td>
     <td>
       <button type="button" onClick={() => removeProduct(idx)}
         style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
     </td>
   </tr>
   );
 })}
</tbody>
                  </table>
                </div>
                {products.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, textAlign: 'right', lineHeight: 1.8 }}>
{Array.from(new Set(products.map(p => p.currency || 'CNY'))).sort().map(currency => {
                       const items = products.filter(p => (p.currency || 'CNY') === currency);
                       const totalForeign = items.reduce((s, p) => {
                         const itemCny = calculateProductFreight(p).totalCny;
                         return s + Number(itemCny || 0);
                       }, 0);
                       const rate = items[0]?.exchangeRate || '3520';
                       const totalVnd = Math.round(totalForeign * Number(rate));
                       return (
                         <div key={currency}>
                           Tổng cước ({currency}): <strong>{totalForeign.toLocaleString('vi-VN')} {currency}</strong>
                           {' × '} {Number(rate).toLocaleString()} (tỷ giá) = <strong style={{ color: '#dc2626' }}>{totalVnd.toLocaleString('vi-VN')} VND</strong>
                         </div>
                       );
                     })}
                     <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                       Tổng cước VC: {products.reduce((s, p) => {
                         return s + calculateProductFreight(p).totalVnd;
                       }, 0).toLocaleString('vi-VN')} VND
                     </div>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Ghi chú</label>
            <textarea name="note" rows={3} value={form.note} onChange={handleChange} />
          </div>

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
