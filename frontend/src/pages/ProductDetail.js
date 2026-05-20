import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  return (
    <div className="product-detail-container">
      <button className="btn btn-back" onClick={() => navigate('/')}>
        ← Back to Products
      </button>

      <div className="product-detail">
        <h1>{product.name}</h1>
        
        <div className="detail-section">
          <h3>Description</h3>
          <p>{product.description || 'No description available'}</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Price</label>
            <p className="price">${product.price.toFixed(2)}</p>
          </div>

          <div className="detail-item">
            <label>Quantity in Stock</label>
            <p className="quantity">{product.quantity} units</p>
          </div>
        </div>

        <div className="detail-section">
          <label>Created At</label>
          <p>{new Date(product.createdAt).toLocaleString()}</p>
        </div>

        <div className="detail-section">
          <label>Updated At</label>
          <p>{new Date(product.updatedAt).toLocaleString()}</p>
        </div>

        <div className="detail-actions">
          <button className="btn btn-edit" onClick={() => navigate(`/edit/${product.id}`)}>
            Edit Product
          </button>
          <button className="btn btn-cancel" onClick={() => navigate('/')}>
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
