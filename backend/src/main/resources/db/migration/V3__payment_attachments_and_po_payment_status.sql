ALTER TABLE payment_requests
  ADD COLUMN attachments VARCHAR(2000) NULL,
  ADD COLUMN note VARCHAR(500) NULL;

ALTER TABLE purchase_orders
  ADD COLUMN payment_status VARCHAR(50) NULL;
