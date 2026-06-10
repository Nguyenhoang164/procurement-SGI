import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ProductForm.css';
import { productAPI, resolveFileUrl } from '../services/api';

function ProductForm({ onSuccess }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    posCode: '',
    productName: '',
    vietnameseName: '',
    oldPosCode: '',
    categoryId: '',
    marketCode: 'VN',
    spec: '',
    unit: '',
    productType: 'NEW',
    status: 'ACTIVE',
    sourceLink: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const data = await productAPI.getById(id);
          setFormData(data);
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          }
        } catch (err) {
          setError(err.message);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleAutoGenerate = async (productName, marketCode, department) => {
    if (!productName || productName.trim().length < 2) return;
    setGenerating(true);
    try {
      const code = await productAPI.generateCode(marketCode, productName, department);
      if (code) {
        setFormData(prev => ({ ...prev, posCode: code }));
      }
    } catch (err) {
      console.error("Auto-generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (formData.productName.trim().length >= 2) {
      const timer = setTimeout(() => {
        handleAutoGenerate(formData.productName, formData.marketCode, formData.department);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [formData.productName, formData.marketCode, formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImageFile = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = async (imageId) => {
    try {
      await productAPI.deleteImage(id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      alert("Lỗi xóa ảnh: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.posCode) {
      alert("Hệ thống chưa tạo được mã POS. Vui lòng kiểm tra lại tên sản phẩm.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await productAPI.update(id, formData);
      } else {
        const created = await productAPI.create(formData);
        if (imageFiles.length > 0) {
          await productAPI.uploadImages(created.id, imageFiles);
        }
        if (onSuccess) onSuccess();
        navigate('/products');
        return;
      }
      if (imageFiles.length > 0) {
        await productAPI.uploadImages(id, imageFiles);
      }
      if (onSuccess) onSuccess();
      navigate('/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{id ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h1>
          <p className="page-subtitle">Thông tin sản phẩm, mã POS tự động, hình ảnh và nguồn hàng</p>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="app-form card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="form-section">
            <h3 className="section-title">Thông tin cơ bản</h3>

            <div className="form-group">
              <label>Tên sản phẩm *</label>
              <input type="text" name="productName" value={formData.productName} onChange={handleChange} required className="form-input" placeholder="Ví dụ: Durex Pro..." />
            </div>

            <div className="form-group">
              <label>Tên tiếng Việt</label>
              <input type="text" name="vietnameseName" value={formData.vietnameseName} onChange={handleChange} className="form-input" placeholder="Nhập tên tiếng Việt..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Thị trường *</label>
                <select name="marketCode" value={formData.marketCode} onChange={handleChange} required>
                  <option value="VN">Việt Nam (VN)</option>
                  <option value="US">Mỹ (US)</option>
                  <option value="CN">Trung Quốc (CN)</option>
                  <option value="JP">Nhật Bản (JP)</option>
                  <option value="PH">Philippines (PH)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mã sản phẩm (POS) (Tự động đề xuất)</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={formData.posCode} readOnly className="form-input read-only"
                    style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1d4ed8' }} />
                  {generating && (
                    <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '12px', color: '#666' }}>Đang tạo...</span>
                  )}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mã POS cũ</label>
                <input type="text" name="oldPosCode" value={formData.oldPosCode} onChange={handleChange} className="form-input" placeholder="POS variation ID từ file Excel..." />
              </div>
              <div className="form-group">
                <label>Phòng kinh doanh</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} className="form-input" placeholder="VD: KINH DOANH, KỸ THUẬT..." />
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '20px' }}>
            <h3 className="section-title">Thông tin chi tiết</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Đơn vị tính</label>
                <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Cái, Bộ..." />
              </div>
              {user?.role === 'ADMIN' ? (
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
                  </select>
                </div>
              ) : null}
            </div>
            <div className="form-group">
              <label>Quy cách</label>
              <textarea name="spec" value={formData.spec} onChange={handleChange} rows="3" />
            </div>
            <div className="form-group">
              <label>Link nguồn hàng (sourceLink)</label>
              <input type="url" name="sourceLink" value={formData.sourceLink} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '20px' }}>
            <h3 className="section-title">Hình ảnh sản phẩm</h3>

            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {images.map((img) => (
                  <div key={img.id} style={{ position: 'relative', width: 120, height: 120 }}>
                    <img src={resolveFileUrl(img.imageUrl)} alt={img.fileName || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />
                    <button type="button" onClick={() => removeExistingImage(img.id)}
                      style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, lineHeight: '22px', textAlign: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>Thêm ảnh mới</label>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              {imageFiles.length > 0 && (
                <ul style={{ marginTop: 8, padding: 0, listStyle: 'none' }}>
                  {imageFiles.map((file, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeImageFile(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || generating}>
              {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;

