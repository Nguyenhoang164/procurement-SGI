UPDATE purchase_orders
SET status = 'DRAFT'
WHERE status IN ('PENDING_L1', 'PENDING_L2');

UPDATE purchase_orders
SET status = 'COMPLETED'
WHERE status = 'RECEIVED';

UPDATE purchase_orders
SET status = 'IN_TRANSIT'
WHERE payment_status = 'PAID'
  AND status = 'APPROVED';
