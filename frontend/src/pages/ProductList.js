import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { productAPI } from '../services/api';
import * as XLSX from 'xlsx';
import '../styles/ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const pageSize = 20;
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.search) {
      setSearchTerm(location.state.search);
    }
  }, [location.state]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

  const uniqueDepartments = [...new Set(products.map(p => p.department).filter(Boolean))].sort();

  const filteredProducts = products.filter((p) =>
    (p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.posCode?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!departmentFilter || p.department === departmentFilter)
  );

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await productAPI.delete(id);
        fetchProducts();
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ sản phẩm? Hành động này không thể hoàn tác!')) return;
    if (!window.confirm('XÁC NHẬN LẦN 2: Toàn bộ sản phẩm sẽ bị xóa vĩnh viễn. Tiếp tục?')) return;
    try {
      await productAPI.deleteAll();
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      alert('Lỗi khi xóa toàn bộ: ' + err.message);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!window.confirm('Cập nhật mã sản phẩm theo quy tắc mới cho tất cả sản phẩm?')) return;
    try {
      const count = await productAPI.regenerateCodes();
      alert(`Đã cập nhật mã cho ${count} sản phẩm`);
      fetchProducts();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const normalizeKey = (key) => key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const findKey = (obj, ...patterns) => {
    const keys = Object.keys(obj);
    for (const p of patterns) {
      const found = keys.find(k => normalizeKey(k) === normalizeKey(p));
      if (found) return obj[found];
    }
    return '';
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (rows.length === 0) return resolve([]);
          const sampleKeys = Object.keys(rows[0]);
          const mapped = rows.map((row) => ({
            productName: findKey(row, ...sampleKeys.filter(k => {
              const nk = normalizeKey(k);
              return nk.includes('ten') || nk.includes('product') || nk.includes('name') || nk.includes('san pham');
            }), 'Tên sản phẩm', 'tên sản phẩm', 'Product Name', 'productName', 'Sản phẩm'),
            marketCode: findKey(row, 'Thị trường', 'thị trường', 'Market', 'market', 'marketCode', 'Market Code'),
            spec: findKey(row, 'Quy cách', 'quy cách', 'Spec', 'spec', 'Quy cách đóng gói'),
            unit: findKey(row, 'Đơn vị', 'đơn vị', 'Unit', 'unit', 'ĐVT'),
            sourceLink: findKey(row, 'Link nguồn', 'link nguồn', 'Source Link', 'sourceLink', 'source_link', 'Link', 'link'),
            oldPosCode: findKey(row, 'POS variation ID', 'Pos variation id', 'pos_variation_id', 'POS variation', 'Mã POS cũ', 'oldPosCode', 'old_pos_code') || 'N/A',
            department: findKey(row, 'Phòng kinh doanh', 'phòng kinh doanh', 'Department', 'department', 'PKD', 'Phòng ban')
          }));
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const data = await readExcelFile(file);
      const result = await productAPI.importExcel(data);
      setImportResult(result);
      fetchProducts();
    } catch (err) {
      alert('Import thất bại: ' + err.message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.size} sản phẩm đã chọn?`)) return;
    try {
      await productAPI.batchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Danh mục sản phẩm</h1>
          <p className="page-subtitle">Quản lý mã POS và thông tin sản phẩm hệ thống SGI</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
            + Thêm sản phẩm
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? 'Đang import...' : 'Import Excel'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} onChange={handleFileSelect} />
          {selectedIds.size > 0 && (
            <button className="btn btn-delete" onClick={handleBatchDelete}>
              Xóa đã chọn ({selectedIds.size})
            </button>
          )}
          <button className="btn btn-delete" onClick={handleDeleteAll} style={{ border: '2px solid #dc2626' }}>
            Xóa toàn bộ sản phẩm
          </button>
          <button className="btn btn-secondary" onClick={handleRegenerateCodes}>
            Cập nhật mã SP
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar-container" style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          width: '100%'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm theo mã POS hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: 180 }}
          >
            <option value="">Tất cả phòng ban</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchProducts}>Làm mới</button>
        </div>

        {importResult && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setImportResult(null)}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: 28, minWidth: 420, maxWidth: 540,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px' }}>Kết quả import</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>{importResult.successCount}</div>
                  <div style={{ fontSize: 13, color: '#166534' }}>Thành công</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: importResult.errorCount > 0 ? '#fef2f2' : '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: importResult.errorCount > 0 ? '#991b1b' : '#64748b' }}>{importResult.errorCount}</div>
                  <div style={{ fontSize: 13, color: importResult.errorCount > 0 ? '#991b1b' : '#64748b' }}>Lỗi</div>
                </div>
              </div>
              {importResult.duplicateNames?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 6 }}>Sản phẩm trùng tên ({importResult.duplicateNames.length})</div>
                  <div style={{ maxHeight: 150, overflowY: 'auto', background: '#fffbeb', borderRadius: 8, padding: 8 }}>
                    {importResult.duplicateNames.map((name, i) => (
                      <div key={i} style={{ padding: '4px 8px', fontSize: 13, color: '#92400e', borderBottom: i < importResult.duplicateNames.length - 1 ? '1px solid #fde68a' : 'none' }}>
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {importResult.errors?.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {importResult.errors.map((err, i) => (
                    <div key={i} style={{ padding: '6px 10px', fontSize: 13, color: '#991b1b', background: '#fef2f2', borderRadius: 6, marginBottom: 4 }}>
                      {err}
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={() => setImportResult(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading" style={{ textAlign: 'center', padding: '60px' }}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-card" style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
            <table className="app-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #edf2f7' }}>
                  <th style={{ width: 40, padding: '16px 12px', textAlign: 'center' }}>
                    <input type="checkbox" checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>MÃ SẢN PHẨM (POS)</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>SẢN PHẨM</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>TÊN TIẾNG VIỆT</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>THỊ TRƯỜNG</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>PHÒNG KINH DOANH</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>QUY CÁCH / ĐƠN VỊ</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.has(p.id) ? '#f0f7ff' : undefined }}>
                      <td style={{ width: 40, padding: '16px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <code
                          onClick={() => navigate(`/products/${p.id}`)}
                          style={{ fontWeight: '700', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          {p.posCode}
                        </code>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.productName}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{p.vietnameseName || '---'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                          {p.marketCode}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{p.department || '---'}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '14px' }}>{p.spec || '---'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>ĐVT: {p.unit}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                          backgroundColor: p.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                          color: p.status === 'ACTIVE' ? '#166534' : '#991b1b'
                        }}>
                          {p.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button className="btn-icon" onClick={() => navigate(`/products/${p.id}`)} style={{ color: '#0f766e', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Chi tiết</button>
                        <button className="btn-icon" onClick={() => navigate(`/products/edit/${p.id}`)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Sửa</button>
                        <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Xóa</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {filteredProducts.length} sản phẩm
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.5 : 1 }}>
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6,
                        background: page === currentPage ? '#2563eb' : '#fff',
                        color: page === currentPage ? '#fff' : '#1e293b',
                        fontWeight: page === currentPage ? 600 : 400, cursor: 'pointer'
                      }}>
                      {page}
                    </button>
                  ))}
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: currentPage >= totalPages ? 'default' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1 }}>
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;

