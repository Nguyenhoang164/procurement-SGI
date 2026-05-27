CREATE TABLE purchase_order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT NOT NULL,
  pos_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),
  product_short_code VARCHAR(100),
  ordered_qty INT NOT NULL,
  unit_price DECIMAL(15,2),
  currency VARCHAR(10),
  exchange_rate DECIMAL(12,4),
  total_amount_foreign DECIMAL(15,2),
  total_amount_vnd DECIMAL(15,0),
  spec VARCHAR(255),
  source_link VARCHAR(500),
  CONSTRAINT fk_poi_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);
