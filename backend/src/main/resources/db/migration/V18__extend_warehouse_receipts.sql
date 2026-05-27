ALTER TABLE warehouse_receipts
  ADD COLUMN waybill_id BIGINT NULL,
  ADD COLUMN waybill_code VARCHAR(100) NULL,
  ADD COLUMN expected_qty INT NULL,
  ADD COLUMN goods_condition VARCHAR(50) NULL;
