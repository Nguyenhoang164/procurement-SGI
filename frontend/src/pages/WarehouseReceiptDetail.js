import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Detail.css';
import { warehouseAPI, productCostAPI } from '../services/api';
import { canCrudWarehouseReceipt, getUser } from '../utils/permissions';

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

function WarehouseReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const canCrud = canCrudWarehouseReceipt(user);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [costMap, setCostMap] = useState({});
  const fileInputRef = useRef(null);
  const API_HOST = 'http://localhost:8080/api';

  const fetchReceipt = useCallback(async () => {
    try {
      const data = await warehouseAPI.getById(id);
      setReceipt(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReceipt(); }, [fetchReceipt]);

  useEffect(() => {
    productCostAPI.getAll().then(costs => {
      const map = {};
      costs.forEach(c => { if (c.posCode) map[c.posCode] = c; });
      setCostMap(map);
    }).catch(() => {});
  }, []);

  const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN') : '-';

  const parseAttachments = (raw) => {
    if (!raw) return [];
    try { return JSON.parse(raw); }
    catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const updated = await warehouseAPI.uploadImages(id, files);
      setReceipt(updated);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="page-content"><div className="loading">Đang tải...</div></div>;
  if (error) return <div className="page-content"><div className="error-message">{error}</div></div>;
  if (!receipt) return <div className="page-content"><div className="error-message">Không tìm thấy phiếu nhận hàng.</div></div>;

  const images = parseAttachments(receipt.attachments);

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Phiếu nhận hàng — #{receipt.id}</h1>
          <p className="page-subtitle">Warehouse Receipt — chi tiết nhập kho và kiểm đếm</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/warehouse')}>Quay lại</button>
        </div>
      </div>

      <div className="page-content">
        <div className="detail-grid">
          <section className="detail-section">
            <h3>Thông tin nhận hàng</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Mã phiếu</span><span className="value">#{receipt.id}</span></div>
              <div className="info-row"><span className="label">Trạng thái</span><span className={`badge badge-${(receipt.status || '').toLowerCase()}`}>{receipt.status || '-'}</span></div>
              <div className="info-row"><span className="label">SL thực tế nhập</span><span className="value">{receipt.receivedQty ?? '-'}</span></div>
              <div className="info-row"><span className="label">SL dự kiến</span><span className="value">{receipt.expectedQty ?? '-'}</span></div>
              <div className="info-row"><span className="label">Ngày nhận</span><span className="value">{formatDate(receipt.receivedDate)}</span></div>
              <div className="info-row"><span className="label">Người kiểm</span><span className="value">{receipt.inspector || '-'}</span></div>
              <div className="info-row"><span className="label">Tình trạng hàng</span><span className="value">{receipt.goodsCondition || '-'}</span></div>
              <div className="info-row"><span className="label">Ghi chú</span><span className="value">{receipt.condition || '-'}</span></div>
            </div>
          </section>

          <section className="detail-section">
            <h3>Liên kết đơn hàng</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="label">Mã đơn (PO)</span>
                <span className="value">
                  {receipt.poId > 0 ? (
                    <a onClick={() => navigate(`/purchase-orders/${receipt.poId}`)}
                      style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                      {receipt.poCode || `PO-${receipt.poId}`}
                    </a>
                  ) : <span>{receipt.poCode || '-'}</span>}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Mã POS</span>
                <span className="value">
                  {receipt.posCode ? (
                    <a onClick={() => navigate(`/products?q=${encodeURIComponent(receipt.posCode)}`)}
                      style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                      {receipt.posCode}
                    </a>
                  ) : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Mã vận đơn</span>
                <span className="value">
                  {receipt.waybillId ? (
                    <a onClick={() => navigate(`/waybills/${receipt.waybillId}`)}
                      style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                      {receipt.waybillCode || `WB-${receipt.waybillId}`}
                    </a>
                  ) : <span>{receipt.waybillCode || '-'}</span>}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Đề nghị thanh toán</span>
                <span className="value">
                  {receipt.paymentRequestCode ? (
                    receipt.paymentRequestId ? (
                      <a onClick={() => navigate(`/payments/${receipt.paymentRequestId}`)}
                        style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>
                        {receipt.paymentRequestCode} →
                      </a>
                    ) : <span>{receipt.paymentRequestCode}</span>
                  ) : '-'}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div style={{ marginTop: 20 }}>
          <section className="detail-section" style={{ gridColumn: '1 / -1' }}>
            <h3>Sản phẩm nhập kho ({(receipt.products || []).length})</h3>
            {(receipt.products && receipt.products.length > 0) ? (
              <div className="table-wrapper">
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th style={{ minWidth: 200 }}>Sản phẩm</th>
                      <th style={{ width: 100 }}>Mã POS</th>
                      <th style={{ width: 80 }}>Chi tiết</th>
                      <th style={{ width: 64, textAlign: 'center' }}>SL đặt</th>
                      <th style={{ width: 64, textAlign: 'center' }}>SL nhận</th>
                      <th style={{ width: 110 }}>Đơn giá</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Giá vốn TB</th>
                      <th style={{ width: 140 }}>Giá vốn gần nhất</th>
                      <th style={{ width: 90 }}>Tình trạng</th>
                      <th style={{ width: 130 }}>Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.products.flatMap((p, idx) => {
                      const item = receipt.items?.[idx];
                      const pVariants = parseVariants(p.spec);
                      const hasVariants = pVariants.some(v => v.name || v.qty);
                      const itemImages = (() => {
                        if (!item?.images) return [];
                        try { return JSON.parse(item.images); }
                        catch { return []; }
                      })();
                      const rows = [];
                      rows.push(
                      <tr key={p.id || idx} style={{ verticalAlign: 'top' }}>
                        <td>{idx + 1}</td>
                        <td>
                          <a onClick={() => navigate(`/products?q=${encodeURIComponent(p.productName || '')}`)}
                            style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>
                            {p.productName || '-'}
                          </a>
                          {item?.conditionDescription && (
                            <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{item.conditionDescription}</div>
                          )}
                        </td>
                        <td>
                          {p.posCode ? (
                            <a onClick={() => navigate(`/products?q=${encodeURIComponent(p.posCode)}`)}
                              style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
                              {p.posCode}
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{!hasVariants ? (p.spec || '-') : pVariants.filter(v => v.name).map(v => `${v.name} (${v.qty || 0})`).join(', ')}</td>
                        <td style={{ textAlign: 'center' }}>{p.orderedQty ?? '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ color: '#059669', fontSize: 14 }}>{item?.receivedQty ?? (receipt.receivedQty ?? '-')}</strong>
                        </td>
                        <td style={{ fontSize: 12 }}>{p.unitPrice ? Number(p.unitPrice).toLocaleString() + ' ' + p.currency : '-'}</td>
                        <td style={{ textAlign: 'right', fontSize: 12 }}>
                          {p.posCode && costMap[p.posCode]?.weightedAvgCostVnd
                            ? Number(costMap[p.posCode].weightedAvgCostVnd).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {p.posCode && costMap[p.posCode]?.latestUnitCostVnd ? (
                            <span>
                              <strong>{Number(costMap[p.posCode].latestUnitCostVnd).toLocaleString('vi-VN')} {costMap[p.posCode].latestCurrency || '₫'}</strong>
                              {costMap[p.posCode].latestOrderCode && (
                                <><br/><span style={{ color: '#64748b' }}>{costMap[p.posCode].latestOrderCode}</span></>
                              )}
                              {costMap[p.posCode].latestCostDate && (
                                <><br/><span style={{ color: '#94a3b8', fontSize: 10 }}>
                                  {new Date(costMap[p.posCode].latestCostDate).toLocaleDateString('vi-VN')}
                                </span></>
                              )}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge badge-${(item?.goodsCondition || receipt.goodsCondition || '').toLowerCase() === 'nguyên vẹn' ? 'paid' : 'pending'}`}
                            style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                            {item?.goodsCondition || receipt.goodsCondition || '-'}
                          </span>
                        </td>
                        <td>
                          {itemImages.length > 0 ? (
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {itemImages.map((url, fi) => (
                                <a key={fi} href={API_HOST + url} target="_blank" rel="noopener noreferrer"
                                  style={{ textDecoration: 'none' }}>
                                  <div style={{
                                    width: 44, height: 33, borderRadius: 4, overflow: 'hidden',
                                    border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer'
                                  }}>
                                    <img src={API_HOST + url} alt={`ảnh ${fi + 1}`}
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : <span className="muted-copy" style={{ fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                      );
                      if (hasVariants) {
                        pVariants.forEach((v, vi) => {
                          if (!v.name && !v.qty) return;
                          rows.push(
                            <tr key={`${p.id || idx}-v${vi}`} style={{ background: '#f8fafc', verticalAlign: 'top' }}>
                              <td></td>
                              <td style={{ paddingLeft: 24, fontSize: 13, color: '#475569' }}>
                                <span style={{ color: '#94a3b8', marginRight: 4 }}>└</span> {v.name}
                              </td>
                              <td></td>
                              <td style={{ fontSize: 12, color: '#64748b' }}>{v.name}</td>
                              <td>{v.qty || 0}</td>
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
              <p className="muted-copy" style={{ marginTop: 8 }}>Không có thông tin sản phẩm.</p>
            )}
          </section>

          <section className="detail-section">
            <h3>Ảnh nhận hàng ({images.length}/3)</h3>
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {images.map((url, idx) => (
                  <a key={idx} href={API_HOST + url} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}>
                    <div style={{
                      width: 100, height: 75, borderRadius: 6, overflow: 'hidden',
                      border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f9fafb', cursor: 'pointer'
                    }}>
                      <img src={API_HOST + url} alt={`Ảnh ${idx + 1}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style=fontSize:10px>' + url.split('/').pop() + '</span>'; }} />
                    </div>
                  </a>
                ))}
              </div>
            )}
            {images.length < 3 && canCrud && (
              <div>
                <input type="file" ref={fileInputRef} multiple accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }} />
                <button type="button" className="btn btn-sm btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}>
                  {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                </button>
                {uploadError && <p className="error-message" style={{ marginTop: 8, fontSize: 12 }}>{uploadError}</p>}
              </div>
            )}
          </section>

          <section className="detail-section">
            <h3>Thời gian</h3>
            <div className="info-list">
              <div className="info-row"><span className="label">Ngày tạo</span><span className="value">{formatDate(receipt.createdAt)}</span></div>
              <div className="info-row"><span className="label">Cập nhật</span><span className="value">{formatDate(receipt.updatedAt)}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReceiptDetail;
