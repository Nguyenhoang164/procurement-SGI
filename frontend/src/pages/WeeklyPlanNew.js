import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { weeklyPlanAPI } from '../services/api';

function WeeklyPlanNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    posCode: '',
    suggestedQty: '',
    spec: '',
    country: '',
    shippingMethod: '',
    recentUnitPrice: '',
    note: ''
  });

  useEffect(() => {
    if (id) {
      fetchPlan();
    }
  }, [id]);

  const fetchPlan = async () => {
    try {
      const data = await weeklyPlanAPI.getById(id);
      setFormData(data);
    } catch (err) {
      setError(err.message);
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
    setLoading(true);
    setError('');

    try {
      if (id) {
        await weeklyPlanAPI.update(id, formData);
      } else {
        await weeklyPlanAPI.create(formData);
      }
      navigate('/weekly-plans');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>{id ? 'Chỉnh sửa' : 'Thêm'} kế hoạch nhập hàng</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mã POS *</label>
          <input
            type="text"
            name="posCode"
            value={formData.posCode}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>SL dự kiến *</label>
            <input
              type="number"
              name="suggestedQty"
              value={formData.suggestedQty}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Giá tham khảo gần đây</label>
            <input
              type="number"
              name="recentUnitPrice"
              value={formData.recentUnitPrice}
              onChange={handleChange}
              step="0.01"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quốc gia</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phương thức VC</label>
            <select name="shippingMethod" value={formData.shippingMethod} onChange={handleChange}>
              <option value="">Chọn...</option>
              <option value="AIR">Đường hàng không</option>
              <option value="SEA">Đường biển</option>
              <option value="LAND">Đường bộ</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Quy cách</label>
          <textarea
            name="spec"
            value={formData.spec}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Ghi chú</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/weekly-plans')}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export default WeeklyPlanNew;
