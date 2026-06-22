import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, productComboAPI, resolveFileUrl } from '../services/api';
import CommentSection from '../components/CommentSection';
import '../styles/ProductDetail.css';

const emptyComboForm = {
  comboName: '',
  baseQty: '1',
  saleUnit: '',
  salePriceVnd: '',
  note: '',
  status: 'ACTIVE'
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [combos, setCombos] = useState([]);
  const [comboForm, setComboForm] = useState({ ...emptyComboForm });
  const [editingComboId, setEditingComboId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, comboData] = await Promise.all([
        productAPI.getById(id),
        productComboAPI.getByProduct(id)
      ]);
      setProduct(productData);
      setCombos(comboData);
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const resetComboForm = () => {
    setComboForm({ ...emptyComboForm, saleUnit: product?.unit || '' });
    setEditingComboId(null);
  };

  useEffect(() => {
    if (product && !comboForm.saleUnit && !editingComboId) {
      setComboForm((current) => ({ ...current, saleUnit: product.unit || '' }));
    }
  }, [product, comboForm.saleUnit, editingComboId]);

  const handleComboChange = (field, value) => {
    setComboForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditCombo = (combo) => {
    setEditingComboId(combo.id);
    setComboForm({
      comboName: combo.comboName || '',
      baseQty: combo.baseQty ?? '1',
      saleUnit: combo.saleUnit || product?.unit || '',
      salePriceVnd: combo.salePriceVnd ?? '',
      note: combo.note || '',
      status: combo.status || 'ACTIVE'
    });
  };

  const handleSaveCombo = async (event) => {
    event.preventDefault();
    if (!comboForm.comboName.trim()) {
      setError('Thiếu tên combo.');
      return;
    }
    if ((Number(comboForm.baseQty) || 0) <= 0) {
      setError('Số lượng quy đổi phải lớn hơn 0.');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      ...comboForm,
      baseQty: Number(comboForm.baseQty) || 1,
      salePriceVnd: Number(comboForm.salePriceVnd) || 0
    };

    try {
      if (editingComboId) {
        await productComboAPI.update(id, editingComboId, payload);
      } else {
        await productComboAPI.create(id, payload);
      }
      resetComboForm();
      const comboData = await productComboAPI.getByProduct(id);
      setCombos(comboData);
    } catch (err) {
      setError(err.message || 'Lưu combo thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCombo = async (comboId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa combo này?')) return;
    try {
      await productComboAPI.delete(id, comboId);
      setCombos((current) => current.filter((combo) => combo.id !== comboId));
      if (editingComboId === comboId) resetComboForm();
    } catch (err) {
      setError(err.message || 'Xóa combo thất bại.');
    }
  };

  const formatMoney = (value) => Number(value || 0).toLocaleString('vi-VN');
  const formatQty = (value) => Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });

  if (loading) return <div className="page-content"><div className="loading">Đang tải sản phẩm...</div></div>;
  if (error && !product) return <div className="page-content"><div className="error-message">{error}</div></div>;
  if (!product) return <div className="page-content"><div className="error-message">Không tìm thấy sản phẩm.</div></div>;

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{product.productName}</h1>
          <p className="page-subtitle">Sản phẩm đơn nhập kho — combo chỉ dùng cho bán hàng, không tạo tồn kho riêng</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>Quay lại</button>
          <button className="btn btn-primary" onClick={() => navigate(`/products/edit/${id}`)}>Sửa sản phẩm</button>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <section className="product-detail-card">
          <div className="product-detail-header">
            <div>
              <div className="product-pos-code">{product.posCode}</div>
              <h2>{product.productName}</h2>
              {product.vietnameseName && (
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: 4 }}>{product.vietnameseName}</div>
              )}
            </div>
            <span className={`badge badge-${product.status?.toLowerCase() || 'active'}`}>
              {product.status === 'ACTIVE' ? 'Đang hoạt động' : product.status || '-'}
            </span>
          </div>

          <div className="product-info-grid">
            <div className="product-info-item">
              <span>Mã POS cũ</span>
              <strong>{product.oldPosCode || 'N/A'}</strong>
            </div>
            <div className="product-info-item">
              <span>Thị trường</span>
              <strong>{product.marketCode || '-'}</strong>
            </div>
            <div className="product-info-item">
              <span>Đơn vị nhập kho</span>
              <strong>{product.unit || 'pcs'}</strong>
            </div>
            <div className="product-info-item">
              <span>Quy cách</span>
              <strong>{product.spec || '-'}</strong>
            </div>
            <div className="product-info-item">
              <span>Link nguồn</span>
              <strong>
                {product.sourceLink ? (
                  <a href={product.sourceLink} target="_blank" rel="noopener noreferrer">Mở link</a>
                ) : '-'}
              </strong>
            </div>
          </div>

          {product.images?.length > 0 && (
            <div className="product-image-strip">
              {product.images.map((image) => (
                <img key={image.id || image.imageUrl} src={resolveFileUrl(image.imageUrl)} alt={product.productName} />
              ))}
            </div>
          )}
        </section>

        <section className="product-detail-card">
          <div className="section-title-row">
            <div>
              <h3>Combo bán hàng</h3>
              <p>Kho vẫn nhập/trừ theo sản phẩm đơn. Khi bán combo, quy đổi về số lượng sản phẩm đơn bên dưới.</p>
            </div>
          </div>

          <form className="combo-form" onSubmit={handleSaveCombo}>
            <div className="combo-code-rule">
              Mã combo tự sinh theo quy tắc <strong>CB-{'{MÃ_POS}'}-{'{STT}'}</strong>, ví dụ <strong>CB-{product.posCode}-01</strong>.
            </div>
            <div className="combo-form-grid">
              <div className="form-group">
                <label>Tên combo <span className="required">*</span></label>
                <input value={comboForm.comboName} onChange={(e) => handleComboChange('comboName', e.target.value)} placeholder="VD: Combo 3 hộp" />
              </div>
              <div className="form-group">
                <label>Quy đổi ra SP đơn <span className="required">*</span></label>
                <input type="number" step="0.001" min="0" value={comboForm.baseQty} onChange={(e) => handleComboChange('baseQty', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Đơn vị bán</label>
                <input value={comboForm.saleUnit} onChange={(e) => handleComboChange('saleUnit', e.target.value)} placeholder={product.unit || 'combo'} />
              </div>
              <div className="form-group">
                <label>Giá bán gợi ý</label>
                <input type="number" value={comboForm.salePriceVnd} onChange={(e) => handleComboChange('salePriceVnd', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={comboForm.status} onChange={(e) => handleComboChange('status', e.target.value)}>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea rows={2} value={comboForm.note} onChange={(e) => handleComboChange('note', e.target.value)} placeholder="VD: Dùng cho kênh bán sỉ / livestream..." />
            </div>
            <div className="combo-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : editingComboId ? 'Cập nhật combo' : 'Thêm combo'}
              </button>
              {editingComboId && (
                <button type="button" className="btn btn-secondary" onClick={resetComboForm}>Hủy sửa</button>
              )}
            </div>
          </form>

          <div className="table-wrapper" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 120 }}>Mã combo</th>
                  <th>Tên combo</th>
                  <th style={{ width: 150 }}>Quy đổi tồn</th>
                  <th style={{ width: 120 }}>Đơn vị bán</th>
                  <th style={{ width: 140 }}>Giá bán</th>
                  <th style={{ width: 110 }}>Trạng thái</th>
                  <th style={{ width: 130 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {combos.length > 0 ? combos.map((combo, index) => (
                  <tr key={combo.id}>
                    <td>{index + 1}</td>
                    <td>{combo.comboCode || '-'}</td>
                    <td>
                      <strong>{combo.comboName}</strong>
                      {combo.note ? <div className="muted-copy">{combo.note}</div> : null}
                    </td>
                    <td>{formatQty(combo.baseQty)} {product.unit || 'pcs'}</td>
                    <td>{combo.saleUnit || '-'}</td>
                    <td className="money">{formatMoney(combo.salePriceVnd)} đ</td>
                    <td>
                      <span className={`badge badge-${combo.status?.toLowerCase() || 'active'}`}>
                        {combo.status === 'ACTIVE' ? 'Đang bán' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-sm btn-view" onClick={() => handleEditCombo(combo)}>Sửa</button>
                        <button type="button" className="btn btn-sm btn-delete" onClick={() => handleDeleteCombo(combo.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>Chưa có combo bán hàng cho sản phẩm này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <CommentSection entityType="PRODUCT" entityId={product.id} />
      </div>
    </div>
  );
}

export default ProductDetail;
