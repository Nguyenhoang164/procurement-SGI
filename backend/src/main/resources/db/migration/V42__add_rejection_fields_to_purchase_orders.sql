ALTER TABLE purchase_orders
  ADD COLUMN rejected_by VARCHAR(100) DEFAULT NULL AFTER note,
  ADD COLUMN rejected_at TIMESTAMP NULL AFTER rejected_by,
  ADD COLUMN reject_reason VARCHAR(500) DEFAULT NULL AFTER rejected_at;
