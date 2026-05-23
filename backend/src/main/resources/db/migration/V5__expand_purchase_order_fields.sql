ALTER TABLE purchase_orders
  ADD COLUMN product_name VARCHAR(255) NULL,
  ADD COLUMN product_short_code VARCHAR(100) NULL,
  ADD COLUMN supplier_name VARCHAR(255) NULL,
  ADD COLUMN international_shipping_unit_price_vnd DECIMAL(15,0) DEFAULT 0,
  ADD COLUMN package_measurement VARCHAR(100) NULL,
  ADD COLUMN total_goods_cost_vnd DECIMAL(15,0) DEFAULT 0,
  ADD COLUMN total_goods_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN order_date DATE NULL,
  ADD COLUMN expected_warehouse_arrival_date DATE NULL,
  ADD COLUMN goods_payment_date DATE NULL,
  ADD COLUMN freight_payment_date DATE NULL,
  ADD COLUMN payment_method VARCHAR(100) NULL;
