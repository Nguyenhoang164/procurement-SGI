-- Add accounting check tracking fields to payment_requests
ALTER TABLE payment_requests
  ADD COLUMN accounting_checked_by VARCHAR(100) NULL,
  ADD COLUMN accounting_checked_at TIMESTAMP NULL;

-- Extend attachments column for warehouse_receipts to support multiple image URLs (JSON array)
ALTER TABLE warehouse_receipts MODIFY COLUMN attachments VARCHAR(2000);
