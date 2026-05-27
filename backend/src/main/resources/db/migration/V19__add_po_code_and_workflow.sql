ALTER TABLE purchase_orders
  ADD COLUMN po_code VARCHAR(50) NULL AFTER id;

UPDATE purchase_orders SET po_code = CONCAT('PO-', id) WHERE po_code IS NULL;
