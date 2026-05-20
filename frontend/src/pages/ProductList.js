import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductItem from '../components/ProductItem';
import '../styles/ProductList.css';

function ProductList({ products, loading, onRefresh }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setFilteredProducts(
      products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [products, searchTerm]);

  const handleDelete = (id) => {
    setFilteredProducts(filteredProducts.filter(p => p.id !== id));
    onRefresh();
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="product-list-container">
      <h1>Products</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="btn btn-refresh" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">No products found</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductItem
              key={product.id}
              product={product}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
