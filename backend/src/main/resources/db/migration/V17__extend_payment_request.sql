CREATE TABLE payment_request_purchase_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_request_id BIGINT NOT NULL,
  po_id BIGINT NOT NULL,
  allocated_amount_vnd DECIMAL(15,0)
);

CREATE TABLE payment_request_waybills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_request_id BIGINT NOT NULL,
  waybill_id BIGINT NOT NULL
);

CREATE TABLE custom_fees (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_request_id BIGINT NOT NULL,
  fee_name VARCHAR(200) NOT NULL,
  fee_amount DECIMAL(15,0) NOT NULL
);

ALTER TABLE payment_requests
  ADD COLUMN exchange_rate_diff_vnd DECIMAL(15,0) DEFAULT 0,
  ADD COLUMN additional_shipping_vnd DECIMAL(15,0) DEFAULT 0,
  ADD COLUMN total_amount_vnd DECIMAL(15,0) DEFAULT 0,
  ADD COLUMN payment_confirmed_at TIMESTAMP NULL,
  ADD COLUMN payment_confirmed_by VARCHAR(100) NULL;
