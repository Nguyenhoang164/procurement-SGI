UPDATE purchase_orders
SET status = 'APPROVED'
WHERE status = 'PAID';

UPDATE purchase_orders
SET payment_status = NULL
WHERE payment_status IS NOT NULL
  AND status NOT IN ('APPROVED', 'IN_TRANSIT', 'COMPLETED');
