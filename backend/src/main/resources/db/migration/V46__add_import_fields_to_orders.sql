ALTER TABLE purchase_orders
    ADD COLUMN initiator_department VARCHAR(100) DEFAULT NULL AFTER note,
    ADD COLUMN source_type VARCHAR(100) DEFAULT NULL AFTER initiator_department,
    ADD COLUMN completed_at DATETIME DEFAULT NULL AFTER updated_at;

ALTER TABLE purchase_order_items
    ADD COLUMN note TEXT DEFAULT NULL AFTER spec;
