-- Flyway baseline schema for SGI Procurement

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  market VARCHAR(10),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE weekly_plans (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proposed_date TIMESTAMP NOT NULL,
  pos_code VARCHAR(50) NOT NULL,
  suggested_qty INT NOT NULL,
  spec VARCHAR(500),
  country VARCHAR(50),
  shipping_method VARCHAR(50),
  recent_unit_price DECIMAL(10,2),
  note VARCHAR(500),
  created_by VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE purchase_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pos_code VARCHAR(50) NOT NULL,
  ordered_qty INT NOT NULL,
  unit_price DECIMAL(10,2),
  recent_unit_price DECIMAL(10,2),
  currency VARCHAR(10),
  exchange_rate DECIMAL(8,4),
  spec VARCHAR(255),
  country VARCHAR(100),
  shipping_method VARCHAR(50),
  note VARCHAR(1000),
  domestic_shipping_vnd DECIMAL(15,0),
  intl_shipping_vnd DECIMAL(15,0),
  order_fee_vnd DECIMAL(15,0),
  local_delivery_fee_vnd DECIMAL(15,0),
  total_lot_cost_vnd DECIMAL(15,0),
  unit_cost_full_vnd DECIMAL(10,2),
  deposit_vnd DECIMAL(15,0),
  remaining_payment_vnd DECIMAL(15,0),
  status VARCHAR(50) NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE payment_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT NOT NULL,
  type VARCHAR(50),
  amount_vnd DECIMAL(15,0),
  currency VARCHAR(10),
  status VARCHAR(50) NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_pr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE TABLE warehouse_receipts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT NOT NULL,
  received_qty INT NOT NULL,
  received_date TIMESTAMP NOT NULL,
  inspector VARCHAR(100),
  condition_description VARCHAR(500),
  attachments VARCHAR(500),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_wr_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pos_code VARCHAR(150) NOT NULL UNIQUE,
  product_name VARCHAR(255) NOT NULL,
  category_id BIGINT,
  market_code VARCHAR(10),
  spec VARCHAR(255),
  unit VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);
