ALTER TABLE payment_requests
  ADD COLUMN rejected_by VARCHAR(100) NULL,
  ADD COLUMN rejected_at TIMESTAMP NULL,
  ADD COLUMN reject_reason VARCHAR(500) NULL,
  ADD COLUMN rejected_level VARCHAR(10) NULL;
