ALTER TABLE payment_requests
  ADD COLUMN source_dntt_ids TEXT DEFAULT NULL AFTER accounting_checked_at,
  ADD COLUMN shipment_items TEXT DEFAULT NULL AFTER source_dntt_ids;
