import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/List.css';
import { weeklyPlanAPI, productAPI } from '../services/api';
import { canCrudWeeklyPlan, canDeleteWeeklyPlan, canCreatePO, getUser } from '../utils/permissions';

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
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateMode, setDateMode] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = (mode) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    switch (mode) {
      case 'today': return { start: today, end: today };
      case 'week': {
        const start = new Date(now);
        start.setDate(d - now.getDay());
        return { start: start.toISOString().slice(0, 10), end: today };
      }
      case 'month': return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: today };
      case 'year': return { start: `${y}-01-01`, end: today };
      case 'custom': return { start: customStartDate, end: customEndDate };
      default: return { start: '', end: '' };
    }
  };

  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (key) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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
  const canCreatePOFromPlan = canCreatePO(userData);
  const getName = (item) => item.productName || productMap[item.posCode] || '-';
  const [selectedItems, setSelectedItems] = useState(new Set());

  const toggleSelectItem = (rowKey) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey); else next.add(rowKey);
      return next;
    });
  };

  const toggleSelectAllInPlan = (planId, items, checked) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      items.forEach((_, idx) => {
        const key = `${planId}-${idx}`;
        if (checked) next.add(key); else next.delete(key);
      });
      return next;
    });
  };

  const getSelectedItemList = () => {
    const result = [];
    filteredPlans.forEach(plan => {
      (plan.items || []).forEach((item, idx) => {
        const key = `${plan.id}-${idx}`;
        if (selectedItems.has(key)) {
          result.push({ ...item, _sourcePlanId: plan.id });
        }
      });
    });
    return result;
  };

  const handleCreatePOFromSelected = () => {
    const items = getSelectedItemList();
    if (items.length === 0) return;
    const sourcePlanIds = [...new Set(items.map(i => i._sourcePlanId))];
    const planRef = sourcePlanIds.length === 1 ? sourcePlanIds[0] : null;
    const firstPlanId = sourcePlanIds.length > 0 ? sourcePlanIds[0] : null;
    const firstPlan = firstPlanId ? filteredPlans.find(p => p.id === firstPlanId) : null;
    const syntheticPlan = {
      id: planRef,
      initiatorDepartment: firstPlan?.initiatorDepartment || '',
      items: items.map(({ _sourcePlanId, ...rest }) => rest)
    };
    setSelectedItems(new Set());
    navigate('/purchase-orders/new', { state: { fromPlan: syntheticPlan } });
  };

  const fetchPlans = async (mode) => {
    setLoading(true);
    try {
      const m = mode || dateMode;
      const { start, end } = getDateRange(m);
      const data = await weeklyPlanAPI.getAll(start, end);
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
    setDateMode('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedItems(new Set());
    fetchPlans('all');
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
        <div className="search-bar-container" style={{ 
          display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px',
          backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', width: '100%'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Tìm kiếm theo mã kế hoạch, VD: KH-0010..." value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <button className="btn btn-secondary" onClick={() => setSearchKeyword('')}>Xóa lọc</button>
            <button className="btn btn-secondary" onClick={handleRefresh}>Làm mới</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 4 }}>Lọc ngày:</span>
            {['all', 'today', 'week', 'month', 'year', 'custom'].map((mode) => (
              <button key={mode}
                onClick={() => { setDateMode(mode); if (mode !== 'custom') fetchPlans(mode); }}
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: 12,
                  background: dateMode === mode ? '#1e3a5f' : '#fff',
                  color: dateMode === mode ? '#fff' : '#334155',
                  cursor: 'pointer', fontWeight: dateMode === mode ? 600 : 400
                }}>
                {mode === 'all' ? 'Tất cả' : mode === 'today' ? 'Hôm nay' : mode === 'week' ? 'Tuần này' : mode === 'month' ? 'Tháng này' : mode === 'year' ? 'Năm nay' : 'Tùy chọn'}
              </button>
            ))}
            {dateMode === 'custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <span style={{ color: '#94a3b8' }}>→</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <button className="btn btn-sm btn-primary" onClick={() => fetchPlans('custom')}
                  style={{ padding: '4px 10px', fontSize: 11 }}>Áp dụng</button>
              </div>
            )}
          </div>
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

        {canCreatePOFromPlan && selectedItems.size > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 20px', marginBottom: 16,
            background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)', color: '#fff',
            borderRadius: 12, boxShadow: '0 4px 16px rgba(30, 58, 95, 0.25)'
          }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              Đã chọn <strong>{selectedItems.size}</strong> sản phẩm
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                onClick={() => setSelectedItems(new Set())}>
                Bỏ chọn
              </button>
              <button className="btn btn-sm" style={{ background: '#16a34a', color: '#fff', fontWeight: 700, border: 'none' }}
                onClick={handleCreatePOFromSelected}>
                Tạo đơn hàng từ mục đã chọn
              </button>
            </div>
          </div>
        )}

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
                  {plan.initiatorDepartment && (
                    <span style={{ background: '#e8f0fe', color: '#1e3a5f', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{plan.initiatorDepartment}</span>
                  )}
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
                  {canCreatePOFromPlan && (
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
                <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="table" style={{ tableLayout: 'auto', width: '100%' }}>
                      <thead>
                        <tr>
                          {canCreatePOFromPlan && (
                            <th style={{ width: 36 }}>
                              <input type="checkbox"
                                checked={plan.items.length > 0 && plan.items.every((_, idx) => selectedItems.has(`${plan.id}-${idx}`))}
                                onChange={(e) => toggleSelectAllInPlan(plan.id, plan.items, e.target.checked)} />
                            </th>
                          )}
                          <th style={{ width: 40 }}>#</th>
                          <th>Tên sản phẩm</th>
                          <th style={{ width: 100 }}>Mã POS</th>
                          <th>SKU</th>
                          <th style={{ width: 80 }}>Loại SP</th>
                          <th>Phòng KD</th>
                          <th style={{ width: 50 }}>SL</th>
                          <th>Tuyến hàng</th>
                          <th style={{ width: 70 }}>VC</th>
                          <th>Giá nhập TK</th>
                          <th style={{ width: 80 }}>Ưu tiên</th>
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
                        const rowKey = `${plan.id}-${idx}`;
                        const isExpanded = expandedRows.has(rowKey);
                        const isSelected = selectedItems.has(rowKey);
                        rows.push(
                          <tr key={item.id || idx} style={isSelected ? { background: '#eff6ff' } : {}}>
                            {canCreatePOFromPlan && (
                              <td>
                                <input type="checkbox" checked={isSelected}
                                  onChange={() => toggleSelectItem(rowKey)} />
                              </td>
                            )}
                            <td>
                              {hasVariants ? (
                                <span onClick={() => toggleRow(rowKey)}
                                  style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 700, color: '#64748b' }}>
                                  {isExpanded ? '▾' : '▸'} {idx + 1}
                                </span>
                              ) : idx + 1}
                            </td>
                            <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{getName(item)}</td>
                            <td>
                              {item.posCode ? (
                                <a href="#"
                                  onClick={(e) => { e.preventDefault(); openProduct(item.posCode); }}
                                  style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                                  {item.posCode}
                                </a>
                              ) : '-'}
                            </td>
                            <td style={{ fontSize: 13, color: '#94a3b8', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{!hasVariants ? '-' : item.posCode}</td>
                            <td>{item.productType === 'NEW' ? 'Hàng mới' : item.productType === 'USED' ? 'Hàng cũ' : item.productType || '-'}</td>
                            <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.department || '-'}</td>
                            <td>{item.suggestedQty}</td>
                            <td>{item.tradeRoute || '-'}</td>
                            <td>{item.shippingMethod || '-'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{item.referencePrice ? Number(item.referencePrice).toLocaleString() : '-'}</td>
                            <td style={{ fontWeight: 600, color: item.priorityLevel === 'Cao' ? '#dc2626' : item.priorityLevel === 'Trung bình' ? '#d97706' : item.priorityLevel === 'Thấp' ? '#16a34a' : 'inherit' }}>
                              {item.priorityLevel || '-'}
                            </td>
                            <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td>
                              {item.sourceLink ? (
                                <a href={item.sourceLink} target="_blank" rel="noopener noreferrer" title={item.sourceLink}
                                  style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 13 }}>
                                  {item.sourceLink.length > 40 ? item.sourceLink.substring(0, 40) + '...' : item.sourceLink}
                                </a>
                              ) : '-'}
                            </td>
                            <td>
                              {item.landing ? (
                                <a href={item.landing} target="_blank" rel="noopener noreferrer" title={item.landing}
                                  style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 13 }}>
                                  {item.landing.length > 40 ? item.landing.substring(0, 40) + '...' : item.landing}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                        if (hasVariants && isExpanded) {
                          itemVariants.forEach((v, vi) => {
                            if (!v.name && !v.qty) return;
                            rows.push(
                              <tr key={`${item.id || idx}-v${vi}`} style={{ background: '#f8fafc' }}>
                                {canCreatePOFromPlan && <td></td>}
                                <td></td>
                                <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                                </td>
                                <td></td>
                                <td style={{ fontSize: 13, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.posCode}-{v.name}</td>
                                <td></td>
                                <td></td>
                                <td style={{ fontSize: 13 }}>{v.qty || 0}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{v.name}</td>
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
