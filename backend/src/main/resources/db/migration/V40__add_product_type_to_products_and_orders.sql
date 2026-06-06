ALTER TABLE products ADD COLUMN product_type VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN product_type VARCHAR(20);
ALTER TABLE purchase_order_items ADD COLUMN product_type VARCHAR(20);
