import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import '../styles/Form.css';
import { paymentRequestAPI, productAPI, purchaseOrderAPI, bankAccountAPI, waybillAPI, resolveFileUrl } from '../services/api';
import { useToast } from '../components/Toast';
import {
  PAYMENT_TYPES, PAPER_TYPES, canCreatePayment,
  getAttachmentFileName, getPaymentStatusBadgeClass, getPaymentStatusLabel, getPaymentTypeLabel, isPaymentEligibleOrder, parseAttachmentUrls,
  suggestAmountForType, formatDnttCode, numberToWords, formatMoney
} from '../utils/paymentUtils';

function PaymentRequestNew() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [poIdToAdd, setPoIdToAdd] = useState(searchParams.get('poId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [customFees, setCustomFees] = useState([]);
  const [formData, setFormData] = useState({
    type: 'MUA_HANG', amountVnd: '', currency: 'VND', note: '',
    exchangeRateDiffVnd: '0', additionalShippingVnd: '0',
    paperType: 'THANH_TOAN', department: '', advanceAmountVnd: '0', amountSpentVnd: '0', reason: ''
  });
  const [referencePaymentRequestId, setReferencePaymentRequestId] = useState('');
  const [referencing, setReferencing] = useState(false);
  const [refError, setRefError] = useState('');
  const [bankAccountInfo, setBankAccountInfo] = useState({
    accountNumber: '', accountHolder: '', bankName: '', qrCode: null
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [bankNames, setBankNames] = useState([]);
  const [showAddBankName, setShowAddBankName] = useState(false);
  const [newBankNameInput, setNewBankNameInput] = useState('');

  const [paidDntts, setPaidDntts] = useState([]);
  const [selectedSourceDntts, setSelectedSourceDntts] = useState([]);
  const [sourceDnttDetails, setSourceDnttDetails] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [shipmentItems, setShipmentItems] = useState([]);
  const [quickViewDntt, setQuickViewDntt] = useState(null);
  const [quickViewDnttLoading, setQuickViewDnttLoading] = useState(false);
  const [quickViewDnttOrders, setQuickViewDnttOrders] = useState([]);

  const [waybills, setWaybills] = useState([]);
  const [selectedWaybillId, setSelectedWaybillId] = useState('');
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [waybillProducts, setWaybillProducts] = useState([]);
  const [waybillTotalFreight, setWaybillTotalFreight] = useState(0);
  const [orderItemManualTotals, setOrderItemManualTotals] = useState({});
  const [shipmentItemManualTotals, setShipmentItemManualTotals] = useState({});

  const updateOrderItemTotal = (itemId, value) => {
    setOrderItemManualTotals(prev => ({ ...prev, [itemId]: value }));
  };

  const updateShipmentItemTotal = (key, value) => {
    setShipmentItemManualTotals(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderAPI.getAll('', 0, 10000);
      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    productAPI.getAll().then(products => {
      const map = {};
      products.forEach(p => { if (p.posCode) map[p.posCode] = p.productName; });
      setProductMap(map);
    }).catch(() => {});
    bankAccountAPI.getAll().then(setBankAccounts).catch(() => {});
    bankAccountAPI.getBankNames().then(list => setBankNames(list.map(b => typeof b === 'string' ? b : b.bankName || '').filter(Boolean))).catch(() => {});
    paymentRequestAPI.getAll().then(list => {
      setPaidDntts(list.filter(p => p.type === 'MUA_HANG' && p.status === 'PAID'));
    }).catch(() => {});
    waybillAPI.getAll().then(setWaybills).catch(() => {});
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    if (id) {
      paymentRequestAPI.getById(id).then(data => {
        if (data.poIds && data.poIds.length > 0) {
          const found = orders.filter(o => data.poIds.includes(o.id));
          setSelectedOrders(found);
        }
      }).catch(() => {});
    }
  }, [id, orders]);

  useEffect(() => {
    if (!isEdit && poIdToAdd && orders.length > 0) {
      const orderId = String(poIdToAdd);
      const found = orders.find(o => String(o.id) === orderId);
      if (found) {
        setSelectedOrders(prev => {
          if (prev.some(s => String(s.id) === orderId)) return prev;
          return [...prev, found];
        });
      }
      setPoIdToAdd('');
    }
  }, [poIdToAdd, orders, isEdit]);

  useEffect(() => {
    if (selectedSourceDntts.length > 0) {
      Promise.all(selectedSourceDntts.map(dnttId => paymentRequestAPI.getById(dnttId)))
        .then(results => {
          setSourceDnttDetails(results);
          const allProducts = [];
          results.forEach(dntt => {
            dntt.poIds?.forEach(poId => {
              const po = orders.find(o => o.id === poId);
              if (po && po.items) {
                po.items.forEach(item => {
                  allProducts.push({
                    sourceDnttId: dntt.id,
                    sourceDnttCode: formatDnttCode(dntt.id),
                    poId: po.id,
                    poCode: po.poCode || 'PO-' + po.id,
                    posCode: item.posCode,
                    productName: item.productName || productMap[item.posCode] || '-',
                    orderedQty: item.orderedQty,
                    unitPrice: item.unitPrice,
                    currency: item.currency,
                    totalAmountForeign: item.totalAmountForeign,
                    totalAmountVnd: item.totalAmountVnd,
                    manualTotal: undefined,
                    spec: item.spec,
                  });
                });
              }
            });
          });
          setAvailableProducts(allProducts);
        }).catch(() => {});
    } else {
      setSourceDnttDetails([]);
      setAvailableProducts([]);
      setSelectedProductIds(new Set());
    }
  }, [selectedSourceDntts, orders, productMap]);

  const addOrder = (orderId) => {
    const idVal = orderId || poIdToAdd;
    if (!idVal) return;
    if (selectedOrders.some(o => String(o.id) === idVal)) return;
    const order = orders.find(o => String(o.id) === idVal);
    if (order) {
      setSelectedOrders(prev => [...prev, order]);
      setPoIdToAdd('');
    }
  };

  const removeOrder = (orderId) => {
    setSelectedOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const suggestTotalAmount = useMemo(() => {
    if (formData.type === 'VAN_CHUYEN') {
      if (selectedWaybill) return waybillTotalFreight;
      return shipmentItems.reduce((sum, item) => {
        const rate = Number(item.exchangeRate) || 0;
        const sub = shipmentItemManualTotals[item.key] !== undefined 
          ? Number(shipmentItemManualTotals[item.key] || 0) 
          : (Number(item.unitPrice) || 0) * (Number(item.orderedQty) || 0);
        return sum + Math.round(sub * rate);
      }, 0);
    }
    if (selectedOrders.length === 0) return 0;
    if (isEdit && formData.amountVnd) return Number(formData.amountVnd);
    return selectedOrders.reduce((sum, order) => {
      if (order.items) {
        const orderTotal = order.items.reduce((s, item) => {
          const manualKey = `order-${order.id}-item-${item.id}`;
          const itemTotal = orderItemManualTotals[manualKey] !== undefined 
            ? Number(orderItemManualTotals[manualKey] || 0) 
            : (Number(item.unitPrice || 0) * Number(item.orderedQty || 0));
          return s + itemTotal;
        }, 0);
        return sum + orderTotal;
      }
      return sum + suggestAmountForType(formData.type, order);
    }, 0);
  }, [selectedOrders, formData.type, formData.amountVnd, isEdit, shipmentItems, selectedWaybill, waybillTotalFreight, orderItemManualTotals, shipmentItemManualTotals]);

  useEffect(() => {
    if (suggestTotalAmount > 0) {
      setFormData((prev) => ({ ...prev, amountVnd: String(suggestTotalAmount) }));
    }
  }, [suggestTotalAmount]);

  const maySubmit = canCreatePayment(user);

  const orderOptions = useMemo(() =>
    orders.filter(isPaymentEligibleOrder).map((order) => ({
      value: String(order.id),
      label: `${order.poCode || 'PO-' + order.id} · ${order.supplierName || order.posCode || 'N/A'}`
    })), [orders]);

  const addCustomFee = () => setCustomFees(f => [...f, { id: null, feeName: '', feeAmount: 0 }]);
  const removeCustomFee = (idx) => setCustomFees(f => f.filter((_, i) => i !== idx));
  const updateCustomFee = (idx, field, value) => setCustomFees(f => f.map((fee, i) => i === idx ? { ...fee, [field]: value } : fee));

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 8) {
      toast.error('Chỉ được chọn tối đa 8 file trong một lần.');
      event.target.value = '';
      return;
    }
    setSelectedFiles(files);
  };

  const handleNumberBeforeInput = (e) => {
    if (e.data === null || e.data === '.' || e.data === ',' || e.data === '-') return;
    if (/^[0-9]$/.test(e.data)) return;
    e.preventDefault();
  };

  const handleNumberPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/^-?\d*\.?\d*$/.test(text)) e.preventDefault();
  };

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    const cleanValue = type === 'number' ? value.replace(/[^0-9.,-]/g, '') : value;
    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
  };

  const selectSourceDntt = (dnttId) => {
    const id = Number(dnttId);
    if (!id) {
      setSelectedSourceDntts([]);
      return;
    }
    setSelectedSourceDntts([id]);
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
      toast.error('Lỗi tải thông tin DNTT: ' + err.message);
    } finally {
      setQuickViewDnttLoading(false);
    }
  };

  const closeQuickViewDntt = () => {
    setQuickViewDntt(null);
    setQuickViewDnttOrders([]);
  };

  const toggleProduct = (idx) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addSelectedProducts = () => {
    const newItems = [];
    selectedProductIds.forEach(idx => {
      const prod = availableProducts[idx];
      if (prod) {
        newItems.push({
          key: `ship-${Date.now()}-${idx}`,
          sourceDnttCode: prod.sourceDnttCode,
          poCode: prod.poCode,
          posCode: prod.posCode,
          productName: prod.productName,
          spec: prod.spec || '',
          orderedQty: prod.orderedQty,
          unitPrice: Number(prod.unitPrice) || 0,
          exchangeRate: '3520',
          currency: prod.currency || 'CNY',
          packageCount: prod.orderedQty || '',
        });
      }
    });
    setShipmentItems(prev => [...prev, ...newItems]);
    setSelectedProductIds(new Set());
  };

  const removeShipmentItem = (key) => {
    setShipmentItems(prev => prev.filter(item => item.key !== key));
  };

  const [refLookupResult, setRefLookupResult] = useState(null);
  const [refSuggestions, setRefSuggestions] = useState([]);
  const [showRefSuggestions, setShowRefSuggestions] = useState(false);
  const [refSearching, setRefSearching] = useState(false);
  const refWrapperRef = useRef(null);

  const handleRefSearch = async (val) => {
    setReferencePaymentRequestId(val);
    setRefError('');
    if (val.trim().length < 1) {
      setShowRefSuggestions(false);
      setRefSuggestions([]);
      return;
    }
    setRefSearching(true);
    try {
      const match = val.match(/(\d+)/);
      const keyword = match ? match[1] : val;
      const results = await paymentRequestAPI.search(keyword);
      setRefSuggestions(results);
      setShowRefSuggestions(results.length > 0);
    } catch {
      setRefSuggestions([]);
    } finally {
      setRefSearching(false);
    }
  };

  const handleRefSelect = async (selected) => {
    setShowRefSuggestions(false);
    setReferencePaymentRequestId(formatDnttCode(selected.id));
    setReferencing(true);
    setRefLookupResult(null);
    try {
      const data = await paymentRequestAPI.getExchangeRateDiff(selected.id);
      setRefLookupResult(data);
      if (data.exchangeRateDiffVnd && Number(data.exchangeRateDiffVnd) > 0) {
        setFormData(prev => ({ ...prev, exchangeRateDiffVnd: String(data.exchangeRateDiffVnd) }));
      }
    } catch {
      setRefError('Không thể lấy thông tin chênh lệch tỷ giá');
    } finally {
      setReferencing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refWrapperRef.current && !refWrapperRef.current.contains(e.target)) {
        setShowRefSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!maySubmit) { toast.error('Tài khoản của bạn không có quyền lập đề nghị thanh toán.'); return; }
    if (formData.type === 'MUA_HANG') {
      if (selectedOrders.length === 0) { toast.error('Vui lòng chọn ít nhất một đơn hàng.'); return; }
    }
    const amount = formData.type === 'VAN_CHUYEN' ? waybillTotalFreight : Number(formData.amountVnd);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Số tiền phải lớn hơn 0.'); return; }
    if (!formData.reason?.trim()) { toast.error('Vui lòng nhập lý do thanh toán.'); return; }

    setLoading(true); setError('');
    const poIds = formData.type === 'VAN_CHUYEN'
      ? [...new Set(shipmentItems.filter(s => s.poId).map(s => Number(s.poId)).concat(shipmentItems.map(s => s.poCode.replace('PO-', '')).filter(Boolean).map(Number)))]
      : selectedOrders.map(o => o.id);
    const exchangeRateDiffVnd = Number(formData.exchangeRateDiffVnd) || 0;
    const additionalShippingVnd = Number(formData.additionalShippingVnd) || 0;
    const customFeeTotal = customFees.reduce((s, f) => s + (Number(f.feeAmount) || 0), 0);
    const totalAmountVnd = amount + exchangeRateDiffVnd + additionalShippingVnd + customFeeTotal;
    const referenceId = referencePaymentRequestId.trim() ? Number(referencePaymentRequestId.trim()) : null;
    const sourceDnttIds = formData.type === 'VAN_CHUYEN' ? JSON.stringify(selectedSourceDntts) : null;
    const shipmentItemsJson = formData.type === 'VAN_CHUYEN' ? JSON.stringify(shipmentItems) : null;
    const effectivePoIds = poIds;
    const waybillIdArr = formData.type === 'VAN_CHUYEN' && selectedWaybillId ? [Number(selectedWaybillId)] : [];
    const payload = {
      poId: effectivePoIds[0] || 0,
      type: formData.type, amountVnd: amount,
      currency: formData.currency || 'VND', reason: formData.reason || '', note: formData.note || '',
      createdBy: user?.username,
      exchangeRateDiffVnd,
      additionalShippingVnd,
      totalAmountVnd,
      customFees: customFees.filter(f => f.feeName && Number(f.feeAmount) > 0),
      referencePaymentRequestId: referenceId,
      poIds: effectivePoIds,
      waybillIds: waybillIdArr,
      sourceDnttIds,
      shipmentItems: shipmentItemsJson,
    };

    try {
      if (!selectedBankAccountId && bankAccountInfo.accountNumber.trim()) {
        const created = await bankAccountAPI.create({
          accountNumber: bankAccountInfo.accountNumber.trim(),
          accountHolder: bankAccountInfo.accountHolder.trim(),
          bankName: bankAccountInfo.bankName.trim()
        });
        payload.bankAccountId = created.id;
        setSelectedBankAccountId(String(created.id));
        if (bankAccountInfo.qrCode) {
          await bankAccountAPI.uploadQrCode(created.id, bankAccountInfo.qrCode);
        }
      } else if (selectedBankAccountId) {
        payload.bankAccountId = Number(selectedBankAccountId);
      }

      let paymentId = id;
      if (isEdit) {
        await paymentRequestAPI.update(id, payload); paymentId = id;
      } else {
        const created = await paymentRequestAPI.create(payload); paymentId = created.id;
      }
      if (selectedFiles.length > 0) await paymentRequestAPI.uploadAttachments(paymentId, selectedFiles);
      navigate(`/payments/${paymentId}`);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{isEdit ? 'Cập nhật đề nghị thanh toán' : 'Lập đề nghị thanh toán mới'}</h1>
          <p className="page-subtitle">Hỗ trợ nhiều PO, mã vận đơn, chi phí phát sinh</p>
        </div>
         <div className="page-actions">
           <button type="button" className="btn btn-secondary" onClick={() => navigate('/payments')}>Hủy</button>
           {!isEdit && (
             <button type="button" className="btn btn-outline" onClick={() => window.print()}>
               In đề nghị
             </button>
           )}
           <button type="submit" form="paymentForm" className="btn btn-primary" disabled={!maySubmit || loading}>
             {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật DNTT' : 'Lập DNTT và gửi duyệt'}
           </button>
         </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <form id="paymentForm" className="app-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Loại thanh toán <span className="required">*</span></legend>
            <div className="form-group">
              <select name="type" value={formData.type} onChange={(e) => {
                setFormData(prev => ({ ...prev, type: e.target.value }));
                if (e.target.value === 'VAN_CHUYEN') {
                  setSelectedOrders([]);
                  setFormData(prev => ({ ...prev, amountVnd: '0' }));
                }
              }} required style={{ fontSize: 16, fontWeight: 600, padding: '12px 14px', width: '100%' }}>
                {PAYMENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </fieldset>

          {formData.type === 'MUA_HANG' ? (
            <>
              <fieldset>
                <legend>Chọn đơn hàng (PO)</legend>
                {selectedOrders.map((order) => (
                  <div key={order.id} className="selected-order" style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#2563eb' }}>{order.poCode || 'PO-' + order.id}</strong>
                        <span className="muted-copy" style={{ marginLeft: 8 }}>{order.supplierName || order.posCode || ''}</span>
                      </div>
                      <button type="button" onClick={() => removeOrder(order.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 13, color: '#475569' }}>
                        {order.items.map((item, i) => (
                          <span key={i}>{item.productName || productMap[item.posCode] || item.posCode}{i < order.items.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                      <span className="muted-copy">Cách tính:</span> Tiền hàng {formatMoney(order.totalGoodsCostVnd)} + VC nội địa {formatMoney(order.domesticShippingVnd)} + Cước VC QT {formatMoney(order.intlShippingVnd)} + Phí đặt hàng {formatMoney(order.orderFeeVnd)} + Ship nội địa {formatMoney(order.localDeliveryFeeVnd)}
                    </div>
                  </div>
                ))}

                {loading ? (
                  <p className="muted-copy">Đang tải danh sách PO...</p>
                ) : orderOptions.length === 0 ? (
                  <p className="muted-copy">Không có đơn hàng đã phê duyệt hoặc đủ điều kiện.</p>
                ) : (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <select style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}
                      value="" onChange={e => addOrder(e.target.value)}>
                      <option value="">-- Thêm đơn hàng --</option>
                      {orderOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedOrders.length > 1 && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, display: 'flex', gap: 24, fontSize: 13 }}>
                    <span><span className="muted-copy">Tổng tiền lô:</span> <strong>{formatMoney(selectedOrders.reduce((s, o) => s + Number(o.totalLotCostVnd || 0), 0))} ₫</strong></span>
                    <span><span className="muted-copy">Tổng còn lại:</span> <strong className="money">{formatMoney(selectedOrders.reduce((s, o) => s + Number(o.remainingPaymentVnd || 0), 0))} ₫</strong></span>
                  </div>
                )}
              </fieldset>

              <fieldset>
                <legend>Thông tin thanh toán</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currency">Loại tiền tệ</label>
                    <select id="currency" name="currency" value={formData.currency} onChange={handleChange}>
                      <option value="VND">VNĐ</option>
                      <option value="USD">USD</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="amountVnd">Số tiền (VNĐ) <span className="required">*</span></label>
                  <input id="amountVnd" name="amountVnd" type="number" min="1" step="1" value={formData.amountVnd}
                    onChange={handleChange} onBeforeInput={handleNumberBeforeInput} onPaste={handleNumberPaste} required />
                </div>
              </fieldset>
            </>
          ) : (
            <>
              <fieldset>
                <legend>Chọn Vận đơn (Waybill)</legend>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <select value={selectedWaybillId} onChange={async (e) => {
                    const wbId = e.target.value;
                    setSelectedWaybillId(wbId);
                    if (!wbId) {
                      setSelectedWaybill(null);
                      setWaybillProducts([]);
                      setShipmentItems([]);
                      setWaybillTotalFreight(0);
                      setShipmentItemManualTotals({});
                      return;
                    }
                    try {
                      const wb = await waybillAPI.getById(wbId);
                      setSelectedWaybill(wb);
                      const prods = wb.products ? (typeof wb.products === 'string' ? JSON.parse(wb.products) : wb.products) : [];
                      if (Array.isArray(prods)) {
                        setWaybillProducts(prods.map(p => ({
                          ...p,
                          waybillCode: wb.waybillCode,
                          waybillId: wbId,
                        })));
                        const items = prods.map((p, i) => ({
                          key: `ship-${Date.now()}-${i}`,
                          waybillCode: wb.waybillCode,
                          waybillId: Number(wbId),
                          poCode: p.poCode || '',
                          posCode: p.posCode || '',
                          productName: p.productName || '',
                          spec: p.spec || '',
                          orderedQty: p.orderedQty || 0,
                          weightOrVolume: Number(p.weightOrVolume) || Number(p.volume) || 0,
                          shippingRate: Number(p.shippingFee) || Number(p.unitPrice) || 0,
                          totalFee: (Number(p.orderedQty) || 0) * (Number(p.shippingFee) || Number(p.unitPrice) || 0),
                          trackingNumber: p.trackingNumber || '',
                          doorToDoorStatus: p.doorToDoorStatus || '',
                          packageCount: p.packageCount || '',
                          exchangeRate: Number(p.exchangeRate) || 1,
                        }));
                        setShipmentItems(items);
                        const totalFees = items.reduce((s, item) => s + (Number(item.totalFee) || 0), 0);
                        setWaybillTotalFreight(totalFees);
                      }
                    } catch (err) {
                      toast.error('Lỗi tải vận đơn: ' + err.message);
                    }
                  }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}>
                    <option value="">-- Chọn Vận đơn --</option>
                    {waybills.filter(wb => wb.status !== 'CANCELLED').map(wb => (
                      <option key={wb.id} value={wb.id}>
                        {wb.waybillCode} - {wb.carrier || ''} - {wb.status || ''}
                      </option>
                    ))}
                  </select>
                  {selectedWaybill && (
                    <button type="button" title="Xem chi tiết vận đơn"
                      onClick={() => window.open(`/waybills/${selectedWaybill.id}`, '_blank')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 8px', borderRadius: 6 }}>
                      👁️
                    </button>
                  )}
                </div>
                {selectedWaybill && (
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, marginBottom: 12, fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span><strong>Mã VB:</strong> {selectedWaybill.waybillCode}</span>
                    <span><strong>Đơn vị VC:</strong> {selectedWaybill.carrier || '-'}</span>
                    <span><strong>SL dự kiến:</strong> {selectedWaybill.expectedQty ?? '-'}</span>
                  </div>
                )}
              </fieldset>

              {waybillProducts.length > 0 && (
                <fieldset>
                  <legend>Sản phẩm từ Vận đơn ({waybillProducts.length})</legend>
                  <p className="muted-copy" style={{ fontSize: 12, marginBottom: 8 }}>
                    Tất cả sản phẩm từ vận đơn đã được tự động thêm vào danh sách bên dưới.
                  </p>
                </fieldset>
              )}

              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b', padding: '4px 0' }}>
                  Hoặc chọn từ DNTT Mua hàng đã thanh toán (mở rộng)
                </summary>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={selectedSourceDntts[0] || ''} onChange={e => selectSourceDntt(e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }}>
                      <option value="">-- Chọn DNTT Mua hàng --</option>
                      {paidDntts.map(dntt => (
                        <option key={dntt.id} value={dntt.id}>
                          {formatDnttCode(dntt.id)} - {Number(dntt.amountVnd || 0).toLocaleString('vi-VN')} ₫
                        </option>
                      ))}
                    </select>
                  </div>
                  {sourceDnttDetails.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {availableProducts.length > 0 ? (
                        <>
                          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                            <table className="table" style={{ fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th style={{ width: 30 }}><input type="checkbox" checked={selectedProductIds.size === availableProducts.length}
                                    onChange={() => {
                                      if (selectedProductIds.size === availableProducts.length) setSelectedProductIds(new Set());
                                      else setSelectedProductIds(new Set(availableProducts.map((_, i) => i)));
                                    }} /></th>
                                  <th>DNTT</th>
                                  <th>PO</th>
                                  <th>Mã POS</th>
                                  <th>Sản phẩm</th>
                                  <th style={{ width: 40 }}>Số lượng</th>
                                </tr>
                              </thead>
                              <tbody>
                                {availableProducts.map((prod, idx) => (
                                  <tr key={idx}>
                                    <td><input type="checkbox" checked={selectedProductIds.has(idx)} onChange={() => toggleProduct(idx)} /></td>
                                    <td style={{ fontSize: 12 }}>{prod.sourceDnttCode}</td>
                                    <td style={{ fontSize: 12 }}>{prod.poCode}</td>
                                    <td style={{ fontSize: 12 }}>{prod.posCode}</td>
                                    <td style={{ fontSize: 12 }}>{prod.productName}</td>
                                    <td style={{ fontSize: 12 }}>{prod.orderedQty}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <button type="button" className="btn btn-primary" onClick={addSelectedProducts}
                            disabled={selectedProductIds.size === 0}>
                            ADD ({selectedProductIds.size}) sản phẩm vào danh sách
                          </button>
                        </>
                      ) : <p className="muted-copy">Đang tải sản phẩm...</p>}
                    </div>
                  )}
                </div>
              </details>

              <fieldset>
                <legend>Danh sách sản phẩm vận chuyển ({shipmentItems.length})</legend>
                {shipmentItems.length === 0 ? (
                  <p className="muted-copy">Chưa có sản phẩm nào. Chọn Vận đơn phía trên.</p>
                ) : (
                  <div className="table-wrapper">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ fontSize: 12, minWidth: 900 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 30 }}>#</th>
                            <th>Tên SP</th>
                            <th style={{ width: 100 }}>Mã POS</th>
                            <th style={{ width: 40 }}>SL</th>
                            <th style={{ width: 55 }}>Số kiện</th>
                            <th style={{ width: 100 }}>Đơn giá</th>
                            <th style={{ width: 110 }}>Tỷ giá → VND</th>
                            <th style={{ width: 100 }}>Thành tiền</th>
                            <th style={{ width: 100 }}>Quy đổi VNĐ</th>
                            <th style={{ width: 35 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentItems.map((item, idx) => {
                            const sub = (Number(item.unitPrice) || 0) * (Number(item.orderedQty) || 0);
                            const rate = Number(item.exchangeRate) || 0;
                            const manualTotal = shipmentItemManualTotals[item.key] !== undefined ? Number(shipmentItemManualTotals[item.key] || 0) : sub;
                            const vnd = Math.round(manualTotal * rate);
                            return (
                              <tr key={item.key}>
                                <td>{idx + 1}</td>
                                <td>{item.productName}</td>
                                <td style={{ fontSize: 11 }}>{item.posCode || '-'}</td>
                                <td>{item.orderedQty}</td>
                                <td>{item.packageCount || item.orderedQty || '-'}</td>
                                <td>{Number(item.unitPrice || 0).toLocaleString()} {item.currency || 'CNY'}</td>
                                <td style={{ fontSize: 11 }}>1 {item.currency || 'CNY'} = {rate.toLocaleString()} VND</td>
                                <td>
                                  <input type="number" step="0.01" value={manualTotal || ''}
                                    onChange={e => updateShipmentItemTotal(item.key, e.target.value)}
                                    style={{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }} />
                                </td>
                                <td className="money">{vnd.toLocaleString('vi-VN')} ₫</td>
                                <td>
                                  <button type="button" onClick={() => removeShipmentItem(item.key)}
                                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {selectedWaybill && (
                      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                        Tổng phí vận chuyển: <strong style={{ color: '#dc2626' }}>{waybillTotalFreight.toLocaleString('vi-VN')} ₫</strong>
                      </div>
                    )}
                  </div>
                )}
              </fieldset>
            </>
          )}

          <fieldset style={{ marginTop: 16, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <legend style={{ fontWeight: 600, color: '#475569' }}>Biểu mẫu giấy đề nghị thanh toán</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Loại phiếu</label>
                <select name="paperType" value={formData.paperType} onChange={handleChange}>
                  {PAPER_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phòng ban / Bộ phận</label>
                <input name="department" value={formData.department}
                  onChange={handleChange} placeholder="VD: Kinh doanh, Kỹ thuật" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số tiền tạm ứng (nếu có)</label>
                <input type="number" name="advanceAmountVnd" value={formData.advanceAmountVnd}
                  onChange={handleChange} onBeforeInput={handleNumberBeforeInput} />
              </div>
              <div className="form-group">
                <label>Số tiền đã chi</label>
                <input type="number" name="amountSpentVnd" value={formData.amountSpentVnd}
                  onChange={handleChange} onBeforeInput={handleNumberBeforeInput} />
              </div>
            </div>
            <div className="form-group">
              <label>Lý do thanh toán <span className="required">*</span></label>
              <textarea name="reason" rows={2} value={formData.reason}
                onChange={handleChange} placeholder="Nhập lý do / nội dung thanh toán" />
            </div>
          </fieldset>

          <fieldset style={{ marginTop: 16, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <legend style={{ fontWeight: 600, color: '#475569' }}>Thông tin tài khoản chuyển khoản</legend>
            <div className="form-group">
              <label>Chọn tài khoản có sẵn</label>
              <select value={selectedBankAccountId} onChange={e => {
                const val = e.target.value;
                setSelectedBankAccountId(val);
                if (val) {
                  const acc = bankAccounts.find(a => String(a.id) === val);
                  if (acc) {
                    setBankAccountInfo({
                      accountNumber: acc.accountNumber,
                      accountHolder: acc.accountHolder,
                      bankName: acc.bankName,
                      qrCode: null
                    });
                  }
                }
              }}>
                <option value="">-- Chọn tài khoản --</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountNumber} ({acc.accountHolder})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: 'center', margin: '8px 0', color: '#94a3b8' }}>— hoặc —</div>
            <div className="form-row">
              <div className="form-group">
                <label>Số tài khoản</label>
                <input value={bankAccountInfo.accountNumber} onChange={e => setBankAccountInfo(f => ({ ...f, accountNumber: e.target.value }))} placeholder="123456789" />
              </div>
              <div className="form-group">
                <label>Chủ tài khoản</label>
                <input value={bankAccountInfo.accountHolder} onChange={e => setBankAccountInfo(f => ({ ...f, accountHolder: e.target.value }))} placeholder="NGUYEN VAN A" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Tên ngân hàng</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input value={bankAccountInfo.bankName} onChange={e => setBankAccountInfo(f => ({ ...f, bankName: e.target.value }))}
                    placeholder="Vietcombank" list="bankNameSuggestions" style={{ flex: 1 }} />
                  <datalist id="bankNameSuggestions">
                    {bankNames.map((bn, i) => <option key={i} value={bn} />)}
                  </datalist>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowAddBankName(true)}>+</button>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>QR Code</label>
                <input type="file" accept="image/*" onChange={e => setBankAccountInfo(f => ({ ...f, qrCode: e.target.files[0] }))} />
              </div>
            </div>
            {showAddBankName && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <input value={newBankNameInput} onChange={e => setNewBankNameInput(e.target.value)}
                  placeholder="Tên ngân hàng mới" style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                  if (!newBankNameInput.trim()) return;
                  try { await bankAccountAPI.addBankName({ bankName: newBankNameInput.trim() }); setBankNames(prev => [...prev, newBankNameInput.trim()]); setNewBankNameInput(''); setShowAddBankName(false); }
                  catch (e) { toast.error(e.message); }
                }}>Lưu</button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddBankName(false)}>Hủy</button>
              </div>
            )}
          </fieldset>

          {formData.type === 'MUA_HANG' && (
            <fieldset style={{ marginTop: 16, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <legend style={{ fontWeight: 600, color: '#475569' }}>Chênh lệch tỷ giá & chi phí phát sinh</legend>
              <div className="form-row">
                <div className="form-group" ref={refWrapperRef} style={{ position: 'relative' }}>
                  <label>TK chênh lệch tỷ giá tham chiếu</label>
                  <input value={referencePaymentRequestId} onChange={e => handleRefSearch(e.target.value)}
                    placeholder="Nhập mã DNTT..." />
                  {showRefSuggestions && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, zIndex: 10, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {refSuggestions.map(pr => (
                        <div key={pr.id} onClick={() => handleRefSelect(pr)}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                          <span><strong>{formatDnttCode(pr.id)}</strong> — {getPaymentTypeLabel(pr.type)}</span>
                          <span style={{ float: 'right', color: '#64748b' }}>{Number(pr.amountVnd || 0).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {referencing && <span className="muted-copy" style={{ fontSize: 12 }}>Đang tra cứu...</span>}
                  {refError && <span style={{ color: '#dc2626', fontSize: 12 }}>{refError}</span>}
                </div>
                <div className="form-group">
                  <label>Chênh lệch TG (VNĐ)</label>
                  <input type="number" name="exchangeRateDiffVnd" value={formData.exchangeRateDiffVnd}
                    onChange={handleChange} onBeforeInput={handleNumberBeforeInput} />
                </div>
              </div>
              <div className="form-group">
                <label>Phí vận chuyển bổ sung (VNĐ)</label>
                <input type="number" name="additionalShippingVnd" value={formData.additionalShippingVnd}
                  onChange={handleChange} onBeforeInput={handleNumberBeforeInput} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Chi phí phát sinh khác</label>
                {customFees.map((fee, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <input value={fee.feeName} onChange={e => updateCustomFee(idx, 'feeName', e.target.value)} placeholder="Tên phí" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <input type="number" value={fee.feeAmount} onChange={e => updateCustomFee(idx, 'feeAmount', e.target.value)} placeholder="Số tiền" style={{ width: 160, padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <button type="button" onClick={() => removeCustomFee(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline" onClick={addCustomFee} style={{ marginTop: 4 }}>+ Thêm chi phí</button>
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend>File đính kèm</legend>
            <div className="form-group">
              <label>Chọn file (tối đa 8 file, hỗ trợ ảnh, pdf, doc, xls)</label>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
              {selectedFiles.length > 0 && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Đã chọn {selectedFiles.length} file.</p>
              )}
            </div>
            {existingAttachments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>File đã đính kèm trước đó:</label>
                <div className="attachment-gallery" style={{ marginTop: 4 }}>
                  {existingAttachments.map((url) => {
                    const fullUrl = resolveFileUrl(url);
                    const name = getAttachmentFileName(url);
                    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
                    return (
                      <div key={url} className="attachment-card">
                        {isImage ? (
                          <a href={fullUrl} target="_blank" rel="noreferrer"><img src={fullUrl} alt={name} className="attachment-thumb" /></a>
                        ) : (
                          <a href={fullUrl} target="_blank" rel="noreferrer" className="attachment-link">{name}</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </fieldset>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="note" rows={2} value={formData.note} onChange={handleChange} placeholder="Ghi chú thêm..." />
          </div>

          <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <span>Tiền đề nghị:</span>
              <strong>{Number(formData.amountVnd || 0).toLocaleString('vi-VN')} ₫</strong>
            </div>
            {formData.type === 'MUA_HANG' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginTop: 6 }}>
                  <span>Phí phát sinh:</span>
                  <strong>{(Number(formData.exchangeRateDiffVnd || 0) + Number(formData.additionalShippingVnd || 0) + customFees.reduce((s, f) => s + (Number(f.feeAmount) || 0), 0)).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700 }}>
              <span>Tổng thanh toán:</span>
              <span className="money">
                {(Number(formData.amountVnd || 0) + Number(formData.exchangeRateDiffVnd || 0) + Number(formData.additionalShippingVnd || 0) + customFees.reduce((s, f) => s + (Number(f.feeAmount) || 0), 0)).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        </form>

        {/* Printable View Section */}
        <div className="printable-view" style={{ marginTop: '24px', padding: '24px', background: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 64, height: 64, background: '#1e3a5f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>LOGO<br/>CÔNG TY</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, textTransform: 'uppercase' }}>ĐỀ NGHỊ THANH TOÁN</h2>
              <p style={{ margin: '4px 0', fontSize: 12, color: '#64748b' }}>Số: ... · Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <hr style={{ margin: '12px 0', border: 'none', borderTop: '2px solid #1e3a5f' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, marginBottom: 12 }}>
            <div><strong>Người đề nghị:</strong> {user?.username || '-'}</div>
            <div><strong>Phòng ban / Bộ phận:</strong> {formData.department || '-'}</div>
            <div><strong>Loại thanh toán:</strong> {formData.paperType === 'HOAN_UNG' ? 'Hoàn ứng' : 'Thanh toán'}</div>
            <div><strong>Loại phiếu:</strong> {formData.type === 'MUA_HANG' ? 'Mua hàng' : 'Vận chuyển'}</div>
          </div>

          {formData.type === 'MUA_HANG' && selectedOrders.length > 0 && (
            <>
              <h4 style={{ margin: '16px 0 8px 0', color: '#334155' }}>Đơn hàng liên quan</h4>
              {selectedOrders.map((order) => (
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
                            <td style={{ textAlign: 'right', padding: '2px', whiteSpace: 'nowrap' }}>
                              <input type="number" step="0.01" value={orderItemManualTotals[`order-${order.id}-item-${item.id}`] !== undefined 
                                ? orderItemManualTotals[`order-${order.id}-item-${item.id}`] 
                                : subForeign.toLocaleString('vi-VN')}
                                onChange={e => updateOrderItemTotal(`order-${order.id}-item-${item.id}`, e.target.value)}
                                style={{ width: '100%', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px', fontSize: 12 }} />
                            </td>
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
                                  <td colSpan={7}></td>
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

          {formData.type === 'VAN_CHUYEN' && shipmentItems.length > 0 && (
            <>
              <h4 style={{ margin: '16px 0 8px 0', color: '#334155' }}>Sản phẩm vận chuyển</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '2px' }}>STT</th>
                    <th style={{ textAlign: 'left', padding: '2px' }}>Tên SP</th>
                    <th style={{ textAlign: 'left', padding: '2px' }}>Mã POS</th>
                    <th style={{ textAlign: 'center', padding: '2px', width: 30 }}>SL</th>
                    <th style={{ textAlign: 'center', padding: '2px' }}>Số kiện</th>
                    <th style={{ textAlign: 'right', padding: '2px' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right', padding: '2px' }}>Thành tiền</th>
                    <th style={{ textAlign: 'right', padding: '2px' }}>Quy đổi VNĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentItems.map((item, idx) => {
                    const sub = (Number(item.unitPrice) || 0) * (Number(item.orderedQty) || 0);
                    const rate = Number(item.exchangeRate) || 0;
                    const vnd = Math.round(sub * rate);
                    return (
                      <tr key={item.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '2px' }}>{idx + 1}</td>
                        <td style={{ padding: '2px' }}>{item.productName || '-'}</td>
                        <td style={{ padding: '2px', fontSize: 11 }}>{item.posCode || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>{item.orderedQty ?? '-'}</td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>{item.packageCount || item.orderedQty || '-'}</td>
                        <td style={{ textAlign: 'right', padding: '2px' }}>{Number(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
                        <td style={{ textAlign: 'right', padding: '2px' }}>
                          <input type="number" step="0.01" value={item.manualTotal !== undefined ? item.manualTotal : sub || ''}
                            onChange={e => {
                              const newItems = [...shipmentItems];
                              newItems[idx] = { ...newItems[idx], manualTotal: e.target.value };
                              setShipmentItems(newItems);
                            }}
                            style={{ width: '100%', padding: '2px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, textAlign: 'right' }} />
                        </td>
                        <td style={{ textAlign: 'right', padding: '2px', fontWeight: 600 }}>{vnd.toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 6, fontSize: 12, textAlign: 'right' }}>
                <strong>Tổng phí vận chuyển: {waybillTotalFreight.toLocaleString('vi-VN')} ₫</strong>
              </div>
            </>
          )}

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />

          <div style={{ fontSize: 14, marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', width: '40%', fontWeight: 600 }}>1. Số tiền tạm ứng (nếu có):</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(formData.advanceAmountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                  <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13 }}>{numberToWords(Number(formData.advanceAmountVnd || 0))} đồng</td>
                </tr>
                <tr style={{ borderTop: '1px dashed #94a3b8' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>2. Số tiền đã chi:</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(formData.amountSpentVnd || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                  <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13 }}>{numberToWords(Number(formData.amountSpentVnd || 0))} đồng</td>
                </tr>
                <tr style={{ borderTop: '2px solid #1e3a5f' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#1e3a5f' }}>3. Đề nghị thanh toán số tiền:</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1e3a5f' }}>{Number(formData.amountVnd || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>Bằng chữ:</td>
                  <td style={{ padding: '4px 8px', fontStyle: 'italic', fontSize: 13, fontWeight: 600 }}>{numberToWords(Number(formData.amountVnd || 0))} đồng</td>
                </tr>
              </tbody>
            </table>
          </div>

          {formData.type === 'MUA_HANG' && (
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              {(() => {
                const diff = Number(formData.exchangeRateDiffVnd || 0);
                const shipping = Number(formData.additionalShippingVnd || 0);
                const fees = customFees.reduce((s, f) => s + (Number(f.feeAmount) || 0), 0);
                const total = Number(formData.amountVnd || 0) + diff + shipping + fees;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                      <span>Chênh lệch tỉ giá:</span>
                      <span>{diff.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                      <span>Phí vận chuyển bổ sung:</span>
                      <span>{shipping.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    {customFees.filter(f => f.feeName && Number(f.feeAmount) > 0).map((fee, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
                        <span>{fee.feeName}:</span>
                        <span>{Number(fee.feeAmount).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontWeight: 700, borderTop: '1px solid #cbd5e1', marginTop: 4 }}>
                      <span>Tổng thanh toán:</span>
                      <span>{total.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 14 }}>
            <p><strong>Lý do thanh toán:</strong> {formData.reason || '...'}</p>
            <p><strong>Ghi chú:</strong> {formData.note || '...'}</p>
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '2px solid #1e3a5f' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, fontSize: 14 }}>
            <div style={{ textAlign: 'center' }}><strong>Người đề nghị</strong></div>
            <div style={{ textAlign: 'center' }}><strong>Kế toán trưởng</strong></div>
            <div style={{ textAlign: 'center' }}><strong>Ban giám đốc</strong></div>
          </div>
        </div>

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
                        <div className="info-row"><span className="label">PO</span><span className="value">{quickViewDntt.poIds ? quickViewDntt.poIds.map(id => `PO-${id}`).join(', ') : '-'}</span></div>
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
    </div>
  );
}

export default PaymentRequestNew;
