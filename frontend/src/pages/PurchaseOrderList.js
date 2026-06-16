import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/List.css';
import '../styles/ProductList.css';
import { purchaseOrderAPI } from '../services/api';
import * as XLSX from 'xlsx';
import Pagination from '../components/Pagination';
import { isAdmin, canCreatePO, canEditPO, canDeletePO, canImportPO, canApprovePO_L1, getUser } from '../utils/permissions';

const statusLabels = {
  DRAFT: 'Nháp', PENDING_L1: 'Chờ duyệt', APPROVED: 'Phê duyệt',
  IN_TRANSIT: 'Vận chuyển',
  COMPLETED: 'Hoàn thành', REJECTED: 'Từ chối'
};

function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [departments, setDepartments] = useState([]);
  const pageSize = 10;
  const navigate = useNavigate();

  const userData = getUser();
  const isAdminUser = isAdmin(userData);
  const canApprove = canApprovePO_L1(userData);
  const userRole = userData?.role;
  const userDept = userData?.department;
  const isDeptRestricted = userRole === 'SALES' || userRole === 'SALES_MANAGER';

  const [selectedDepartment, setSelectedDepartment] = useState(
    isDeptRestricted && userDept ? userDept : ''
  );
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
      case 'today':
        return { start: today, end: today };
      case 'week': {
        const start = new Date(now);
        start.setDate(d - now.getDay());
        return { start: start.toISOString().slice(0, 10), end: today };
      }
      case 'month':
        return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: today };
      case 'year':
        return { start: `${y}-01-01`, end: today };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: '', end: '' };
    }
  };

  useEffect(() => {
    fetchOrders(selectedDepartment, 0);
    purchaseOrderAPI.getDepartments().then(list => {
      setDepartments(list);
    }).catch(() => {});
  }, []);

  const fetchOrders = async (dept, page = 0) => {
    setLoading(true);
    setCurrentPage(page);
    try {
      const department = dept || (isDeptRestricted ? userDept : selectedDepartment);
      const { start, end } = getDateRange(dateMode);
      const data = await purchaseOrderAPI.getAll(department, page, pageSize, start, end);
      setOrders(data.orders || data);
      setTotalItems(data.total || data.length || 0);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await purchaseOrderAPI.delete(id);
      setOrders((current) => current.filter((order) => order.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Xóa TẤT CẢ đơn hàng? Hành động này không thể hoàn tác!')) return;
    try {
      await purchaseOrderAPI.deleteAll();
      setOrders([]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(0);
    const dept = isDeptRestricted ? userDept : selectedDepartment;
    if (!searchKeyword.trim()) { fetchOrders(dept, 0); return; }
    try {
      const data = await purchaseOrderAPI.search(searchKeyword, dept);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setSelectedDepartment(dept);
    fetchOrders(dept, 0);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const orders = Array.isArray(data) ? data : [data];
        const result = await purchaseOrderAPI.importOrders(orders);
        alert(result.message || 'Import thành công!');
        fetchOrders(selectedDepartment, 0);
      } catch (err) {
        alert('Lỗi import: ' + err.message);
      }
    };
    input.click();
  };

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await purchaseOrderAPI.importExcel(file);
        const msg = `Import ${result.successCount}/${result.totalOrders} đơn hàng thành công` +
          (result.errors?.length ? `\n${result.errors.join('\n')}` : '');
        alert(msg);
        fetchOrders(selectedDepartment, 0);
      } catch (err) {
        alert('Lỗi import Excel: ' + err.message);
      }
    };
    input.click();
  };

  const getName = (item) => item.productName || '-';

  const handleExportExcel = () => {
    const rows = orders.flatMap(order => {
      const items = order.items && order.items.length > 0 ? order.items : [{ posCode: order.posCode, productName: order.productName, orderedQty: order.orderedQty, unitPrice: order.unitPrice, spec: order.spec }];
      return items.map((item, idx) => ({
        'Mã PO': order.poCode || 'PO-' + order.id,
        'Trạng thái': statusLabels[order.status] || order.status,
        'Phòng ban': order.initiatorDepartment || '',
        'Nhà cung cấp': order.supplierName || '',
        'Tên sản phẩm': getName(item),
        'Mã POS': item.posCode || '',
        'SL': item.orderedQty || 0,
        'Đơn giá': item.unitPrice ? Number(item.unitPrice).toLocaleString() : 0,
        'Tiền tệ': item.currency || 'CNY',
        'Thành tiền NT': item.totalAmountForeign ? Number(item.totalAmountForeign).toLocaleString() : 0,
        'Thành tiền VND': item.totalAmountVnd ? Number(item.totalAmountVnd).toLocaleString() : 0,
        'Tổng tiền lô (VND)': order.totalLotCostVnd ? Number(order.totalLotCostVnd).toLocaleString() : 0,
        'Đã đặt cọc': order.depositVnd ? Number(order.depositVnd).toLocaleString() : 0,
        'Còn lại': order.remainingPaymentVnd ? Number(order.remainingPaymentVnd).toLocaleString() : 0,
        'Ngày đặt': order.orderDate || '',
        'Phương thức VC': order.shippingMethod || '',
        'Ghi chú': order.note || '',
        'Ngày tạo': order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '',
      }));
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');
    XLSX.writeFile(wb, `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const pageOrders = orders;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Đơn hàng mua hàng</h1>
          <p className="page-subtitle">Danh sách PO — Chờ duyệt → Phê duyệt → Vận chuyển → Hoàn tất</p>
        </div>
        <div className="page-actions">
          {canCreatePO(userData) && (
            <button className="btn btn-primary" onClick={() => navigate('/purchase-orders/new')}>Tạo đơn hàng mới</button>
          )}
          {canImportPO(userData) && (
            <>
              <button className="btn btn-secondary" onClick={handleImport}>Import JSON</button>
              <button className="btn btn-secondary" onClick={handleImportExcel}>Import Excel</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={handleExportExcel}>Xuất Excel</button>
          {isAdminUser && (
            <button className="btn btn-danger" onClick={handleDeleteAll} style={{ marginLeft: 8 }}>Xóa tất cả</button>
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
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}>🔍</span>
              <input type="text" placeholder="Tìm kiếm theo mã PO..." value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
                style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </div>
            {departments.length > 0 && (
              <select value={selectedDepartment} onChange={handleDepartmentChange}
                disabled={isDeptRestricted}
                style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#fff', cursor: isDeptRestricted ? 'not-allowed' : 'pointer', opacity: isDeptRestricted ? 0.7 : 1, maxWidth: 80 }}>
                <option value="">{isDeptRestricted ? userDept || 'PB' : 'PB'}</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            <button className="btn btn-secondary" onClick={handleSearch} style={{ padding: '5px 10px', borderRadius: '5px', fontSize: 11, whiteSpace: 'nowrap' }}>Tìm</button>
            <button className="btn btn-secondary" onClick={() => fetchOrders(selectedDepartment, 0)} style={{ padding: '5px 10px', borderRadius: '5px', fontSize: 11, whiteSpace: 'nowrap' }}>Làm mới</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 4 }}>Lọc ngày:</span>
            {['all', 'today', 'week', 'month', 'year', 'custom'].map((mode) => (
              <button key={mode}
                onClick={() => { setDateMode(mode); if (mode !== 'custom') fetchOrders(selectedDepartment, 0); }}
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
                <button className="btn btn-sm btn-primary" onClick={() => fetchOrders(selectedDepartment, 0)}
                  style={{ padding: '4px 10px', fontSize: 11 }}>Áp dụng</button>
              </div>
            )}
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">Chưa có đơn hàng nào.</div>
        ) : (
          pageOrders.map((order) => (
            <div key={order.id} className="table-card" style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a href={`/purchase-orders/${order.id}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/purchase-orders/${order.id}`); }}
                    style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
                    {order.poCode || 'PO-' + order.id}
                  </a>
                  {order.paymentStatus === 'REJECTED' ? (
                    <span className="badge badge-rejected">Từ chối</span>
                  ) : order.paymentStatus === 'PAID' ? (
                    <span className="badge badge-completed">Đã thanh toán</span>
                  ) : (
                    <span className={`badge badge-${order.status?.toLowerCase()}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  )}
                  <span style={{ color: '#64748b', fontSize: 13 }}>
                    {order.items ? order.items.length : 0} sản phẩm
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                  {order.initiatorDepartment && (
                    <span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>Phòng ban: {order.initiatorDepartment}</span>
                  )}
                  {order.supplierName && (
                    <span style={{ color: '#64748b', fontSize: 13 }}>{order.supplierName}</span>
                  )}
                  {order.landing && (
                    <a href={order.landing} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: 13, textDecoration: 'underline' }}>
                      Landing
                    </a>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: order.paymentStatus === 'REJECTED' ? 'var(--muted)' : 'var(--blue)' }}>
                    {order.totalLotCostVnd?.toLocaleString()} đ
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {order.status === 'PENDING_L1' && canApprove && (
                    <button className="btn btn-sm btn-approve" onClick={() => navigate(`/purchase-orders/${order.id}`)}>Phê duyệt</button>
                  )}
                  <button className="btn btn-sm btn-view" onClick={() => navigate(`/purchase-orders/${order.id}`)}>Xem</button>
                  {canEditPO(userData) && (
                    <button className="btn btn-sm btn-view" onClick={() => navigate(`/purchase-orders/edit/${order.id}`)}>Sửa</button>
                  )}
                  {canDeletePO(userData) && (
                    <button className="btn btn-sm btn-delete" onClick={() => handleDelete(order.id)}>Xóa</button>
                  )}
                </div>
              </div>

              {order.items && order.items.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 180 }}>Tên sản phẩm</th>
                        <th style={{ width: 110 }}>Mã POS</th>
                        <th style={{ width: 150 }}>MÃ BIẾN THỂ (SKU)</th>
                        <th style={{ width: 100 }}>Chi tiết</th>
                        <th style={{ width: 60, textAlign: 'right' }}>SL</th>
                        <th style={{ width: 110, textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ width: 100, textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ width: 90, textAlign: 'right' }}>GV TB</th>
                        <th style={{ width: 90, textAlign: 'right' }}>GV gần nhất</th>
                        <th style={{ width: 80, textAlign: 'right' }}>Ngày TH</th>
                        <th style={{ width: 90, textAlign: 'right' }}>Quy đổi VNĐ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.flatMap((item, idx) => {
                        const sub = (parseFloat(item.unitPrice) || 0) * (parseInt(item.orderedQty, 10) || 0);
                        const vnd = Math.round(sub * (parseFloat(item.exchangeRate) || 1));
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
                            <td>{item.posCode && item.posCode !== 'N/A' ? (
                              <a href="#"
                                onClick={(e) => { e.preventDefault(); navigate('/products', { state: { search: item.posCode } }); }}
                                style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                                {item.posCode}
                              </a>
                            ) : '-'}</td>
                            <td style={{ fontSize: 12, color: '#94a3b8' }}>{item.posCode && item.posCode !== 'N/A' ? item.posCode : '-'}</td>
                            <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (item.spec || '-') : itemVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                            <td style={{ textAlign: 'right' }}>{item.orderedQty}</td>
                            <td style={{ textAlign: 'right' }}>{Number(item.unitPrice || 0).toLocaleString()} {item.currency || 'CNY'}</td>
                            <td style={{ textAlign: 'right' }}>{sub.toLocaleString()} {item.currency || 'CNY'}</td>
                            <td style={{ textAlign: 'right' }}>
                              {item.weightedAvgCostVnd
                                ? Number(item.weightedAvgCostVnd).toLocaleString('vi-VN')
                                : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.latestUnitCostVnd != null
                                ? `${Number(item.latestUnitCostVnd).toLocaleString('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ${item.latestCurrency || '₫'}`
                                : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                              {item.latestCostDate
                                ? new Date(item.latestCostDate).toLocaleDateString('vi-VN')
                                : '—'}
                            </td>
                            <td style={{ textAlign: 'right', color: order.paymentStatus === 'REJECTED' ? 'var(--muted)' : 'var(--blue)', fontWeight: 600 }}>{vnd.toLocaleString()} đ</td>
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
                                  <td style={{ fontSize: 12, color: '#64748b' }}>{item.posCode} - {v.name}</td>
                                  <td style={{ fontSize: 12, color: '#475569' }}>{v.name}</td>
                                  <td style={{ textAlign: 'right', fontSize: 13 }}>{v.qty || 0}</td>
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
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  Không có sản phẩm
                </div>
              )}
            </div>
          ))
        )}
        <Pagination
          currentPage={currentPage + 1}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => fetchOrders(selectedDepartment, p - 1)}
          label="đơn hàng"
        />
      </div>
    </div>
  );
}

export default PurchaseOrderList;
