import React from 'react';
import '../styles/ProductItem.css';

function ProductItem({ product, onDelete, onEdit }) {
  const handleDelete = async () => {
    if (window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Xóa sản phẩm thất bại');
        onDelete(product.id);
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
      }
    }
  };

  return (
    <div className="product-item">
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="description">{product.description || 'Chưa có mô tả'}</p>
        <div className="product-details">
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="quantity">Tồn kho: {product.quantity}</span>
        </div>
      </div>
      <div className="product-actions">
        <button className="btn btn-edit" onClick={() => onEdit(product.id)}>
          Sửa
        </button>
        <button className="btn btn-delete" onClick={handleDelete}>
          Xóa
        </button>
      </div>
    </div>
  );
}

export default ProductItem;
