import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { purchaseOrderAPI, productAPI } from '../services/api';
import { useCreateOrder } from '../hooks/useOrders';

function PurchaseOrderNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    posCode: '',
    orderedQty: '',
    unitPrice: '',
    currency: 'USD',
    exchangeRate: '1',
    domesticShippingVnd: '0',
    intlShippingVnd: '0',
    orderFeeVnd: '0',
    localDeliveryFeeVnd: '0',
    depositVnd: '0'
  });
  
  // add extra fields from spec
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      recentUnitPrice: prev.recentUnitPrice || '',
      spec: prev.spec || '',
      country: prev.country || '',
      shippingMethod: prev.shippingMethod || '',
      note: prev.note || '',
      createdBy: prev.createdBy || ''
    }));
  }, []);
  const [calculated, setCalculated] = useState({
    totalLotCostVnd: 0,
    unitCostFullVnd: 0,
    remainingPaymentVnd: 0
  });

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    calculateCosts();
  }, [formData]);

  const { createOrder, loading: creating, error: createError } = useCreateOrder();

  const fetchOrder = async () => {
    try {
      const data = await purchaseOrderAPI.getById(id);
      setFormData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateCosts = () => {
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const exchangeRate = parseFloat(formData.exchangeRate) || 1;
    const qty = parseInt(formData.orderedQty) || 0;
    const domestic = parseFloat(formData.domesticShippingVnd) || 0;
    const intl = parseFloat(formData.intlShippingVnd) || 0;
    const fee = parseFloat(formData.orderFeeVnd) || 0;
    const delivery = parseFloat(formData.localDeliveryFeeVnd) || 0;
    const deposit = parseFloat(formData.depositVnd) || 0;

    const unitPriceVnd = unitPrice * exchangeRate;
    const totalGoods = unitPriceVnd * qty;
    const totalCost = totalGoods + domestic + intl + fee + delivery;
    const unitCost = qty > 0 ? totalCost / qty : 0;
    const remaining = totalCost - deposit;

    setCalculated({
      totalLotCostVnd: Math.round(totalCost),
      unitCostFullVnd: unitCost.toFixed(2),
      remainingPaymentVnd: Math.round(remaining)
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.posCode || formData.posCode.trim() === '') errors.posCode = 'Mã POS bắt buộc';
    if (!formData.orderedQty || parseInt(formData.orderedQty) <= 0) errors.orderedQty = 'Số lượng phải lớn hơn 0';
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) errors.unitPrice = 'Giá đơn vị phải lớn hơn 0';
    if (!formData.exchangeRate || parseFloat(formData.exchangeRate) <= 0) errors.exchangeRate = 'Tỉ giá phải lớn hơn 0';
    return errors;
  };

  const handleGeneratePos = async () => {
    try {
      const market = formData.country ? formData.country.substring(0,2).toUpperCase() : 'VN';
      const category = 'EL';
      const code = await productAPI.generateCode(market, category);
      setFormData(prev => ({ ...prev, posCode: code }));
    } catch (e) {
      console.error('Generate POS failed', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setError('');
    try {
      const submitData = {
        ...formData,
        totalLotCostVnd: calculated.totalLotCostVnd,
        unitCostFullVnd: calculated.unitCostFullVnd,
        remainingPaymentVnd: calculated.remainingPaymentVnd
      };

      if (id) {
        await purchaseOrderAPI.update(id, submitData);
      } else {
        await createOrder(submitData);
      }
      navigate('/purchase-orders');
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu đơn hàng');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>{id ? 'Chỉnh sửa' : 'Tạo'} đơn hàng (PKD2)</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Thông tin sản phẩm & đặt hàng</legend>
          
          <div className="form-group">
            <label>Mã POS *</label>
            <div style={{display:'flex', gap:8}}>
              <input
                type="text"
                name="posCode"
                value={formData.posCode}
                onChange={handleChange}
                required
              />
              <button type="button" className="btn" onClick={handleGeneratePos}>Preview POS</button>
            </div>
            {fieldErrors.posCode && <div className="field-error">{fieldErrors.posCode}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SL đặt hàng *</label>
              <input
                type="number"
                name="orderedQty"
                value={formData.orderedQty}
                onChange={handleChange}
                required
              />
              {fieldErrors.orderedQty && <div className="field-error">{fieldErrors.orderedQty}</div>}
            </div>
            <div className="form-group">
              <label>Giá đơn vị *</label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                step="0.01"
                required
              />
              {fieldErrors.unitPrice && <div className="field-error">{fieldErrors.unitPrice}</div>}
            </div>
            <div className="form-group">
              <label>Giá gần nhất (VNĐ)</label>
              <input
                type="number"
                name="recentUnitPrice"
                value={formData.recentUnitPrice}
                onChange={handleChange}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Đơn vị tiền</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          </div>
          {fieldErrors.exchangeRate && <div className="field-error">{fieldErrors.exchangeRate}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label>Quốc gia</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Quy cách</label>
              <input type="text" name="spec" value={formData.spec} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hình thức vận chuyển</label>
              <input type="text" name="shippingMethod" value={formData.shippingMethod} onChange={handleChange} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Chi phí vận chuyển</legend>

          <div className="form-row">
            <div className="form-group">
              <label>VC quốc tế (VNĐ)</label>
              <input
                type="number"
                name="intlShippingVnd"
                value={formData.intlShippingVnd}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>VC nội địa (VNĐ)</label>
              <input
                type="number"
                name="domesticShippingVnd"
                value={formData.domesticShippingVnd}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phí đặt hàng (VNĐ)</label>
              <input
                type="number"
                name="orderFeeVnd"
                value={formData.orderFeeVnd}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Phí giao hàng địa phương (VNĐ)</label>
              <input
                type="number"
                name="localDeliveryFeeVnd"
                value={formData.localDeliveryFeeVnd}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tỉ giá USD/VNĐ</label>
            <input
              type="number"
              name="exchangeRate"
              value={formData.exchangeRate}
              onChange={handleChange}
              step="0.0001"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Tổng hợp & Giá vốn (Tự động tính)</legend>

          <div className="calculated-box">
            <div className="calc-row">
              <span>Tổng tiền lô:</span>
              <span className="value">{calculated.totalLotCostVnd.toLocaleString()} ₫</span>
            </div>
            <div className="calc-row">
              <span>GV 1 sản phẩm:</span>
              <span className="value">{parseFloat(calculated.unitCostFullVnd).toFixed(0)} ₫</span>
            </div>
          </div>

          <div className="form-group">
            <label>Tiền deposit (VNĐ)</label>
            <input
              type="number"
              name="depositVnd"
              value={formData.depositVnd}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="note" value={formData.note} onChange={handleChange} />
          </div>

          <div className="calculated-box">
            <div className="calc-row">
              <span>Còn phải thanh toán:</span>
              <span className="value">{calculated.remainingPaymentVnd.toLocaleString()} ₫</span>
            </div>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurchaseOrderNew;
