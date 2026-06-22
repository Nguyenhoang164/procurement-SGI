import React, { useState, useEffect, useCallback } from 'react';
import { noteAPI } from '../services/api';
import '../styles/CommentSection.css';

const ENTITY_LABELS = {
  PRODUCT: 'Sản phẩm',
  PURCHASE_ORDER: 'PO',
  PAYMENT_REQUEST: 'Yêu cầu thanh toán',
  WEEKLY_PLAN: 'Kế hoạch tuần',
  WAYBILL: 'Vận đơn',
  WAREHOUSE_RECEIPT: 'Phiếu nhập kho',
  TRADE_ROUTE: 'Tuyến hàng',
  BANK_ACCOUNT: 'Tài khoản ngân hàng',
};

function CommentSection({ entityType, entityId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const data = await noteAPI.get(entityType, entityId);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    const text = newComment.trim();
    if (!text) return;
    setPosting(true);
    try {
      const created = await noteAPI.create({
        entityType,
        entityId,
        content: text,
      });
      setComments(prev => [created, ...prev]);
      setNewComment('');
    } catch (err) {
      alert(err.message || 'Không thể gửi bình luận');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const label = ENTITY_LABELS[entityType] || entityType;

  return (
    <section className="comment-section">
      <h3 className="comment-section-title">
        Bình luận
        {comments.length > 0 && <span className="comment-count">({comments.length})</span>}
      </h3>

      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder={`Nhập bình luận về ${label.toLowerCase()}...`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={posting}
        />
        <button
          className="comment-post-btn"
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
        >
          {posting ? 'Đang gửi...' : 'Gửi'}
        </button>
      </div>

      <div className="comment-list">
        {loading ? (
          <div className="comment-loading">Đang tải...</div>
        ) : comments.length === 0 ? (
          <div className="comment-empty">Chưa có bình luận nào.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{c.createdBy || 'Unknown'}</span>
                <span className="comment-time">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="comment-content">{c.content}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;
