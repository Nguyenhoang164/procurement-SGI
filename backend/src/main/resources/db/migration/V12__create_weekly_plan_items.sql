CREATE TABLE weekly_plan_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  plan_id BIGINT NOT NULL,
  pos_code VARCHAR(50),
  product_type VARCHAR(20),
  suggested_qty INT NOT NULL,
  country VARCHAR(100),
  shipping_method VARCHAR(50),
  reference_price DECIMAL(15,2),
  spec TEXT,
  source_link VARCHAR(500),
  priority_level VARCHAR(20),
  CONSTRAINT fk_wpi_plan FOREIGN KEY (plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE
);
