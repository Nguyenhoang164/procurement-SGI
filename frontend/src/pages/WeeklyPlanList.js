import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { weeklyPlanAPI, productAPI } from '../services/api';
import { canCrudWeeklyPlan, canDeleteWeeklyPlan, getUser } from '../utils/permissions';

const statusLabels = {
  'DRAFT': 'Bản nháp',
  'PENDING_L1': 'Chờ duyệt L1',
  'PENDING_L2': 'Chờ duyệt L2',
  'APPROVED': 'Đã duyệt',
  'REJECTED': 'Từ chối',
  'COMPLETED': 'Hoàn thành'
};

function WeeklyPlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productMap, setProductMap] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const [searchKeyword, setSearchKeyword] = useState(() => (
    location.state?.search || new URLSearchParams(location.search).get('search') || ''
  ));

  useEffect(() => {
    fetchPlans();
    productAPI.getAll().then(products => {
      const map = {};
      products.forEach(p => { if (p.posCode) map[p.posCode] = p.productName; });
      setProductMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const incomingSearch = location.state?.search || new URLSearchParams(location.search).get('search') || '';
    if (incomingSearch) setSearchKeyword(incomingSearch);
  }, [location.state, location.search]);

  const userData = getUser();
  const canCrud = canCrudWeeklyPlan(userData);
  const canDelete = canDeleteWeeklyPlan(userData);
  const getName = (item) => item.productName || productMap[item.posCode] || '-';

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
    if (!window.confirm('Bạn chắc chắn muốn xóa kế hoạch này?')) return;
    try {
      await weeklyPlanAPI.delete(id);
      setPlans((current) => current.filter((plan) => plan.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const openProduct = (posCode) => {
    if (!posCode) return;
    navigate('/products', { state: { search: posCode } });
  };

  const getPlanCode = (id) => `KH-${String(id).padStart(4, '0')}`;
  const filteredPlans = plans.filter((plan) => {
    const keyword = searchKeyword.trim().toUpperCase();
    if (!keyword) return true;
    const compactKeyword = keyword.replace(/^KH-?/, '').replace(/^0+/, '');
    const planId = String(plan.id);
    return getPlanCode(plan.id).includes(keyword) || planId === compactKeyword || planId.includes(compactKeyword);
  });

  const handleRefresh = () => {
    setSearchKeyword('');
    fetchPlans();
  };

  const totalItems = filteredPlans.reduce((sum, p) => sum + (p.items ? p.items.length : 0), 0);
  const approvedPlans = filteredPlans.filter((p) => p.status === 'APPROVED' || p.status === 'COMPLETED').length;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Kế hoạch nhập hàng tuần</h1>
          <p className="page-subtitle">Bước đề xuất nhu cầu trước khi chuyển sang đơn hàng PKD2</p>
        </div>
        <div className="page-actions">
          {canCrud && (
            <button className="btn btn-primary" onClick={() => navigate('/weekly-plans/new')}>
              Thêm kế hoạch
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" placeholder="Tìm kiếm theo mã kế hoạch, VD: KH-0010..." value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          <button className="btn btn-secondary" onClick={() => setSearchKeyword('')}>Xóa lọc</button>
          <button className="btn btn-secondary" onClick={handleRefresh}>Làm mới</button>
        </div>

        <div className="plan-stats">
          <div className="plan-stat">
            <div className="plan-stat-label">Tổng kế hoạch</div>
            <div className="plan-stat-value" style={{ color: '#2563eb' }}>{filteredPlans.length}</div>
          </div>
          <div className="plan-stat">
            <div className="plan-stat-label">Tổng sản phẩm</div>
            <div className="plan-stat-value" style={{ color: '#059669' }}>{totalItems}</div>
          </div>
          <div className="plan-stat">
            <div className="plan-stat-label">Đã duyệt / tạo đơn</div>
            <div className="plan-stat-value" style={{ color: '#d97706' }}>{approvedPlans}</div>
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="empty-state">{plans.length === 0 ? 'Chưa có kế hoạch nào.' : 'Không tìm thấy kế hoạch phù hợp.'}</div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="table-card" style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a href={`/weekly-plans?search=${encodeURIComponent(getPlanCode(plan.id))}`}
                    onClick={(e) => { e.preventDefault(); setSearchKeyword(getPlanCode(plan.id)); }}
                    style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none', fontSize: 14, cursor: 'pointer' }}>
                    {getPlanCode(plan.id)}
                  </a>
                  <span style={{ fontWeight: 600 }}>
                    {plan.proposedDate
                      ? new Date(plan.proposedDate).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>
                    {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </span>
                  <span className={`badge badge-${plan.status?.toLowerCase() || 'draft'}`}>
                    {statusLabels[plan.status] || plan.status}
                  </span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>
                    {plan.items ? plan.items.length : 0} sản phẩm
                  </span>
                  {plan.note && (
                    <span style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                      {plan.note}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {canCrud && (
                    <button className="btn btn-sm btn-view" onClick={() => navigate(`/weekly-plans/edit/${plan.id}`)}>
                      Sửa
                    </button>
                  )}
                  {canCrud && (
                    <button className="btn btn-sm btn-primary" onClick={() => navigate('/purchase-orders/new', { state: { fromPlan: plan } })}>
                      Tạo đơn
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn btn-sm btn-delete" onClick={() => handleDelete(plan.id)}>
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {plan.items && plan.items.length > 0 ? (
                <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
                  <table className="table" style={{ minWidth: 960 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 180 }}>Tên sản phẩm</th>
                        <th style={{ width: 110 }}>Mã POS</th>
                        <th style={{ width: 150 }}>MÃ BIẾN THỂ (SKU)</th>
                        <th style={{ width: 100 }}>Loại SP</th>
                        <th style={{ width: 120 }}>PHÒNG KINH DOANH</th>
                        <th style={{ width: 60 }}>SL</th>
                        <th style={{ width: 110 }}>Tuyến hàng</th>
                        <th style={{ width: 90 }}>VC</th>
                        <th style={{ width: 100 }}>Giá nhập TK</th>
                        <th style={{ width: 70 }}>Ưu tiên</th>
                        <th>Chi tiết</th>
                        <th>Link nguồn</th>
                        <th>Landing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.items.flatMap((item, idx) => {
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
                              {item.posCode ? (
                                <a href="#"
                                  onClick={(e) => { e.preventDefault(); openProduct(item.posCode); }}
                                  style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                                  {item.posCode}
                                </a>
                              ) : '-'}
                            </td>
                            <td></td>
                            <td>{item.productType === 'NEW' ? 'Hàng mới' : item.productType === 'USED' ? 'Hàng cũ' : item.productType || '-'}</td>
                            <td>{item.department || '-'}</td>
                            <td>{item.suggestedQty}</td>
                            <td>{item.tradeRoute || '-'}</td>
                            <td>{item.shippingMethod || '-'}</td>
                            <td>{item.referencePrice ? Number(item.referencePrice).toLocaleString() : '-'}</td>
                            <td>{item.priorityLevel || '-'}</td>
                            <td>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.sourceLink ? (
                                <a href={item.sourceLink} target="_blank" rel="noopener noreferrer">{item.sourceLink}</a>
                              ) : '-'}
                            </td>
                            <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.landing ? (
                                <a href={item.landing} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{item.landing}</a>
                              ) : '-'}
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
                                <td style={{ fontSize: 13 }}>{item.posCode} - {v.name}</td>
                                <td></td>
                                <td></td>
                                <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
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
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  Không có sản phẩm nào trong kế hoạch này.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WeeklyPlanList;
