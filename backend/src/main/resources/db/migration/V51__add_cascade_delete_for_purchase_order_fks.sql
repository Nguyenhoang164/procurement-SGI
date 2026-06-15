ALTER TABLE payment_requests DROP FOREIGN KEY fk_pr_po;
ALTER TABLE payment_requests ADD CONSTRAINT fk_pr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE warehouse_receipts DROP FOREIGN KEY fk_wr_po;
ALTER TABLE warehouse_receipts ADD CONSTRAINT fk_wr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;
