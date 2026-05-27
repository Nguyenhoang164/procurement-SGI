CREATE TABLE product_combos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  combo_code VARCHAR(80),
  combo_name VARCHAR(255) NOT NULL,
  base_qty DECIMAL(12,3) NOT NULL DEFAULT 1,
  sale_unit VARCHAR(50),
  sale_price_vnd DECIMAL(15,0) DEFAULT 0,
  note VARCHAR(500),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_product_combos_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
