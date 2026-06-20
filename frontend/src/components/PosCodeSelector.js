import React, { useState, useEffect, useRef } from 'react';
import { productAPI } from '../services/api';

function PosCodeSelector({ value, onChange, onProductSelect, department }) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ productName: '', marketCode: 'VN', spec: '', unit: '' });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [sourceLink, setSourceLink] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSearch = async (val) => {
    setSearchTerm(val);
    onChange(val);
    if (val.length > 1) {
      try {
        const results = await productAPI.search(val, department);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectProduct = (product) => {
    if (product.status !== 'ACTIVE') {
      return;
    }
    setSearchTerm(product.posCode);
    onChange(product.posCode);
    if (onProductSelect) {
      onProductSelect(product);
    }
    setShowSuggestions(false);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({ productName: searchTerm, marketCode: 'VN', spec: '', unit: '' });
    setSourceLink('');
    setShowCreateModal(true);
    setShowSuggestions(false);
  };

  const handleCreateProduct = async () => {
    if (!createForm.productName) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    setCreatingProduct(true);
    try {
      const newProduct = await productAPI.create({ ...createForm, status: 'ACTIVE', sourceLink: sourceLink || undefined });
      setSearchTerm(newProduct.posCode);
      onChange(newProduct.posCode);
      if (onProductSelect) {
        onProductSelect(newProduct);
      }
      setShowCreateModal(false);
    } catch (err) {
      alert("Lỗi tạo sản phẩm mới: " + err.message);
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleGenerateDirect = async () => {
    const match = searchTerm.match(/^(.+?-)(\d{4})$/);
    if (match) {
      const code = `${match[1]}${String(parseInt(match[2], 10) + 1).padStart(4, '0')}`;
      setSearchTerm(code);
      onChange(code);
    } else {
      setGenerating(true);
      try {
        const code = await productAPI.generateCode('VN', searchTerm || 'SP', 0);
        setSearchTerm(code);
        onChange(code);
      } catch (err) {
        alert("Lỗi khi sinh mã: " + err.message);
      } finally {
        setGenerating(false);
      }
    }
  };

  return (
    <div className="pos-code-selector" ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            autoComplete="off"
            style={{ width: '100%' }}
          />
          {showSuggestions && (
            <ul className="suggestions-list" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              zIndex: 1000,
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {suggestions.map((p) => {
                const inactive = p.status !== 'ACTIVE';
                return (
                  <li
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    title={inactive ? 'Tạm ngưng bán' : undefined}
                    style={{
                      padding: '8px 12px',
                      cursor: inactive ? 'not-allowed' : 'pointer',
                      borderBottom: '1px solid #eee',
                      opacity: inactive ? 0.5 : 1,
                      textDecoration: inactive ? 'line-through' : 'none',
                      color: inactive ? '#9ca3af' : 'inherit'
                    }}
                    onMouseOver={(e) => { if (!inactive) e.target.style.backgroundColor = '#f5f5f5'; }}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {inactive ? <span style={{ color: '#ef4444', marginRight: 6 }}>✕</span> : null}
                    <strong>{p.posCode}</strong> - {p.productName}
                    {inactive ? <span style={{ marginLeft: 8, fontSize: 11, color: '#ef4444' }}>(Tạm ngưng)</span> : null}
                  </li>
                );
              })}
              {suggestions.length === 0 && searchTerm.length > 1 && (
                <li
                  onClick={handleOpenCreateModal}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: 13,
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#eff6ff'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  + Tạo sản phẩm mới: "{searchTerm}"
                </li>
              )}
            </ul>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGenerateDirect}
          disabled={generating}
          style={{ whiteSpace: 'nowrap' }}
        >
          {generating ? 'Đang tạo...' : 'Đề xuất mã mới'}
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '8px',
            width: '460px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0 }}>Tạo danh mục sản phẩm mới</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Tên sản phẩm *</label>
              <input
                type="text"
                value={createForm.productName}
                onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })}
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Thị trường</label>
              <select
                value={createForm.marketCode}
                onChange={(e) => setCreateForm({ ...createForm, marketCode: e.target.value })}
              >
                <option value="VN">Việt Nam (VN)</option>
                <option value="US">Mỹ (US)</option>
                <option value="CN">Trung Quốc (CN)</option>
                <option value="JP">Nhật Bản (JP)</option>
                <option value="PH">Philippines (PH)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Quy cách</label>
              <input
                type="text"
                value={createForm.spec}
                onChange={(e) => setCreateForm({ ...createForm, spec: e.target.value })}
                placeholder="VD: Hộp 10 cái"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Đơn vị</label>
              <input type="text" value={createForm.unit}
                onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                placeholder="VD: Cái, Hộp, Kg" />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Link nguồn hàng</label>
              <input type="url" value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateProduct}
                disabled={creatingProduct}
              >
                {creatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosCodeSelector;
