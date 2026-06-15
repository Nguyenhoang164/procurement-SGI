import React from 'react';
import '../styles/Pagination.css';

function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, label = 'mục' }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const maxVisible = 6;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = Math.floor(maxVisible / 2);
    let start = currentPage - half;
    let end = currentPage + half - 1;
    if (start < 1) { start = 1; end = maxVisible; }
    if (end > totalPages) { end = totalPages; start = totalPages - maxVisible + 1; }
    const pages = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const fromItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const toItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {totalItems > 0 ? `${fromItem}-${toItem} / ${totalItems} ${label}` : `0 ${label}`}
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Đầu"
        >
          «
        </button>
        <button
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trước"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
          ) : (
            <button
              key={p}
              className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Sau"
        >
          ›
        </button>
        <button
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Cuối"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default Pagination;
