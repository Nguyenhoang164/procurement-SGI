import React from 'react';
import '../styles/ProductItem.css';

function ProductItem({ product, onDelete, onEdit }) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete product');
        onDelete(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div className="product-item">
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="description">{product.description || 'No description'}</p>
        <div className="product-details">
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="quantity">Stock: {product.quantity}</span>
        </div>
      </div>
      <div className="product-actions">
        <button className="btn btn-edit" onClick={() => onEdit(product.id)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default ProductItem;
