-- Flyway baseline schema for SGI Procurement

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  market VARCHAR(10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE weekly_plans (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proposed_date TIMESTAMP,
  pos_code VARCHAR(100),
  suggested_qty INT,
  spec VARCHAR(255),
  country VARCHAR(100),
  shipping_method VARCHAR(50),
  recent_unit_price DECIMAL(10,2),
  note VARCHAR(1000),
  created_by VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE purchase_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pos_code VARCHAR(100) NOT NULL,
  ordered_qty INT,
  unit_price DECIMAL(10,2),
  recent_unit_price DECIMAL(10,2),
  currency VARCHAR(10),
  exchange_rate DECIMAL(18,6),
  spec VARCHAR(255),
  country VARCHAR(100),
  shipping_method VARCHAR(50),
  note VARCHAR(1000),
  domestic_shipping_vnd DECIMAL(18,0),
  intl_shipping_vnd DECIMAL(18,0),
  order_fee_vnd DECIMAL(18,0),
  local_delivery_fee_vnd DECIMAL(18,0),
  total_lot_cost_vnd DECIMAL(18,0),
  unit_cost_full_vnd DECIMAL(10,2),
  deposit_vnd DECIMAL(18,0),
  remaining_payment_vnd DECIMAL(18,0),
  status VARCHAR(50),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE payment_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT,
  type VARCHAR(50),
  amount_vnd DECIMAL(18,0),
  currency VARCHAR(10),
  status VARCHAR(50),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_pr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE TABLE warehouse_receipts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT,
  received_qty INT,
  received_date TIMESTAMP,
  inspector VARCHAR(100),
  "condition" VARCHAR(255),
  attachments VARCHAR(2000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_wr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pos_code VARCHAR(150) NOT NULL UNIQUE,
  product_name VARCHAR(255),
  category_id BIGINT,
  market_code VARCHAR(10),
  spec VARCHAR(255),
  unit VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);
