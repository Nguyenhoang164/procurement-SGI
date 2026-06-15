import React, { useCallback, useEffect, useState } from 'react';
import '../styles/List.css';
import { productCostAPI } from '../services/api';
import { getUser, canDeleteProductCost } from '../utils/permissions';

function ProductCostList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const userData = getUser();
  const canDelete = canDeleteProductCost(userData);

  const loadCosts = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const data = await productCostAPI.getAll();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  const handleExport = () => {
    if (items.length === 0) return;
    const header = ['Mã POS', 'Tên SP', 'Số lô', 'Tổng SL', 'GV lô gần nhất', 'GV BQ gia quyền', 'Chênh lệch', 'Tiền tệ'];
    const rows = items.map((row) => [
      row.posCode,
      row.productName,
      row.lotCount,
      row.totalQty,
      row.latestUnitCostVnd,
      row.weightedAvgCostVnd,
      row.costDifferenceVnd,
      row.latestCurrency || 'VND'
    ]);
    const csv = [header, ...rows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gia-von-san-pham.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (posCode) => {
    if (!window.confirm(`Xóa giá vốn của sản phẩm "${posCode}"?`)) return;
    try {
      await productCostAPI.delete(posCode);
      setItems((current) => current.filter((row) => row.posCode !== posCode));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Xóa TẤT CẢ giá vốn sản phẩm? Hành động này không thể hoàn tác!')) return;
    try {
      await productCostAPI.deleteAll();
      setItems([]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const totalPages = Math.ceil(items.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Giá vốn sản phẩm</h1>
          <p className="page-subtitle">GV bình quân gia quyền — cập nhật sau khi nhận hàng (đơn đã thanh toán)</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={loadCosts}>
            Làm mới
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={items.length === 0}>
            Export
          </button>
          {canDelete && (
            <button type="button" className="btn btn-danger" onClick={handleDeleteAll} style={{ marginLeft: 8 }}>
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            Chưa có dữ liệu giá vốn. Nhận hàng các đơn đã thanh toán để hệ thống tính GV bình quân.
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã POS</th>
                    <th>Tên sản phẩm</th>
                    <th>Số lô</th>
                    <th>Tổng SL</th>
                    <th>GV lô gần nhất</th>
                    <th>GV BQ gia quyền</th>
                    <th>Chênh lệch</th>
                    <th>Tiền tệ</th>
                    {canDelete && <th style={{width:60}}></th>}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => {
                    const diff = Number(row.costDifferenceVnd ?? 0);
                    const diffClass = diff > 0 ? 'cost-diff-up' : diff < 0 ? 'cost-diff-down' : '';
                    return (
                      <tr key={row.posCode}>
                        <td>{row.posCode}</td>
                        <td>{row.productName}</td>
                        <td>{row.lotCount}</td>
                        <td>{row.totalQty?.toLocaleString('vi-VN')}</td>
                        <td className="money">{formatMoney(row.latestUnitCostVnd, row.latestCurrency)}</td>
                        <td className="money">{formatMoney(row.weightedAvgCostVnd, row.latestCurrency)}</td>
                        <td className={`money ${diffClass}`}>
                          {diff > 0 ? '+' : ''}
                          {formatMoney(diff, row.latestCurrency)}
                        </td>
                        <td>{row.latestCurrency || 'VND'}</td>
                        {canDelete && (
                          <td>
                            <button className="btn btn-sm btn-delete" onClick={() => handleDelete(row.posCode)}>Xóa</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
                <button className="btn btn-sm btn-secondary" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>‹ Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    style={{
                      minWidth: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 4,
                      background: p === currentPage ? '#2563eb' : '#fff',
                      color: p === currentPage ? '#fff' : '#374151',
                      fontWeight: p === currentPage ? 700 : 400, cursor: 'pointer'
                    }}
                    onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button className="btn btn-sm btn-secondary" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>Sau ›</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getCurrencySymbol(currency) {
  const map = {
    VND: '₫',
    USD: '$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KRW: '₩',
    PHP: '₱',
  };
  return map[currency] || '₫';
}

function formatMoney(value, currency) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  const symbol = getCurrencySymbol(currency);
  return `${num.toLocaleString('vi-VN')}${symbol}`;
}

export default ProductCostList;
