import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { weeklyPlanAPI } from '../services/api';

function WeeklyPlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await weeklyPlanAPI.getAll();
      setPlans(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa?')) {
      try {
        await weeklyPlanAPI.delete(id);
        setPlans(plans.filter(p => p.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Kế hoạch nhập hàng tuần</h1>
        <button className="btn btn-primary" onClick={() => navigate('/weekly-plans/new')}>
          + Thêm kế hoạch
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : plans.length === 0 ? (
        <div className="empty-state">Chưa có kế hoạch nào</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã POS</th>
                <th>SL dự kiến</th>
                <th>Quốc gia</th>
                <th>Phương thức VC</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.posCode}</td>
                  <td>{plan.suggestedQty}</td>
                  <td>{plan.country}</td>
                  <td>{plan.shippingMethod}</td>
                  <td>
                    <span className={`badge badge-${plan.status?.toLowerCase()}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-edit" onClick={() => navigate(`/weekly-plans/edit/${plan.id}`)}>
                      Sửa
                    </button>
                    <button className="btn btn-sm btn-delete" onClick={() => handleDelete(plan.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanList;
