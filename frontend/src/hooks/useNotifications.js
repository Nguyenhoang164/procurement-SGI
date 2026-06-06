import { useCallback, useEffect, useMemo, useState } from 'react';
import { paymentRequestAPI, purchaseOrderAPI, weeklyPlanAPI } from '../services/api';
import { userAPI } from '../services/userApi';

const PENDING_STATUSES = ['PENDING', 'PENDING_L1', 'PENDING_L2'];
const READ_KEY = 'sgi_notification_read';

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  PENDING_L1: 'Chờ duyệt L1',
  PENDING_L2: 'Chờ duyệt L2'
};

const TYPE_META = {
  weekly_plan: { label: 'Kế hoạch tuần', prefix: 'KH' },
  purchase_order: { label: 'Đơn hàng', prefix: 'PO' },
  payment_request: { label: 'Đề nghị TT', prefix: 'DNTT' },
  user_pending: { label: 'Tài khoản mới', prefix: 'TK' }
};

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function isPending(status) {
  return PENDING_STATUSES.includes(status);
}

function buildNotifications(weeklyPlans, orders, payments, users) {
  const items = [];

  weeklyPlans.filter((p) => isPending(p.status)).forEach((plan) => {
    items.push({
      id: `weekly_plan-${plan.id}`,
      entityType: 'weekly_plan',
      entityId: plan.id,
      title: plan.posCode || `Kế hoạch #${plan.id}`,
      message: `${TYPE_META.weekly_plan.label} · ${STATUS_LABELS[plan.status] || plan.status}`,
      status: plan.status,
      statusLabel: STATUS_LABELS[plan.status] || plan.status,
      link: `/weekly-plans/edit/${plan.id}`,
      createdAt: plan.createdAt || plan.updatedAt,
      priority: plan.status === 'PENDING_L2' ? 'high' : 'normal'
    });
  });

  orders.filter((o) => isPending(o.status)).forEach((order) => {
    items.push({
      id: `purchase_order-${order.id}`,
      entityType: 'purchase_order',
      entityId: order.id,
      title: order.posCode || `PO #${order.id}`,
      message: `${TYPE_META.purchase_order.label} · ${STATUS_LABELS[order.status] || order.status}`,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      link: `/purchase-orders/${order.id}`,
      createdAt: order.createdAt || order.updatedAt,
      priority: order.status === 'PENDING_L2' ? 'high' : 'normal'
    });
  });

  payments.filter((p) => isPending(p.status)).forEach((payment) => {
    const amount = payment.amountVnd != null
      ? `${Number(payment.amountVnd).toLocaleString('vi-VN')} ₫`
      : '';
    items.push({
      id: `payment_request-${payment.id}`,
      entityType: 'payment_request',
      entityId: payment.id,
      title: payment.poId ? `DNTT · PO #${payment.poId}` : `DNTT #${payment.id}`,
      message: [TYPE_META.payment_request.label, STATUS_LABELS[payment.status], amount]
        .filter(Boolean)
        .join(' · '),
      status: payment.status,
      statusLabel: STATUS_LABELS[payment.status] || payment.status,
      link: `/payments/${payment.id}`,
      createdAt: payment.createdAt || payment.updatedAt,
      priority: payment.status === 'PENDING_L2' ? 'high' : 'normal'
    });
  });

  (users || []).filter((u) => u.role === 'PENDING').forEach((user) => {
    items.push({
      id: `user_pending-${user.id}`,
      entityType: 'user_pending',
      entityId: user.id,
      title: user.username,
      message: `Tài khoản mới đăng ký · Chờ phân quyền`,
      status: 'PENDING',
      statusLabel: 'Chờ phân quyền',
      link: `/users/${user.id}`,
      createdAt: user.createdAt,
      priority: 'normal'
    });
  });

  return items.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === 'high' ? -1 : 1;
    }
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function formatNotificationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function useNotifications({ autoRefreshMs = 15000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(loadReadIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [weeklyPlans, orders, payments] = await Promise.all([
        weeklyPlanAPI.getAll(),
        purchaseOrderAPI.getAll(),
        paymentRequestAPI.getAll()
      ]);
      let users = [];
      try { users = await userAPI.getAll(); } catch {}
      setNotifications(buildNotifications(weeklyPlans, orders, payments, users));
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefreshMs) return undefined;
    const timer = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(timer);
  }, [autoRefreshMs, refresh]);

  const withReadState = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        read: readIds.has(item.id)
      })),
    [notifications, readIds]
  );

  const unreadCount = useMemo(
    () => withReadState.filter((item) => !item.read).length,
    [withReadState]
  );

  const markRead = useCallback((id) => {
    setReadIds((current) => {
      const next = new Set(current);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((current) => {
      const next = new Set(current);
      notifications.forEach((item) => next.add(item.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  return {
    notifications: withReadState,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    typeMeta: TYPE_META
  };
}
