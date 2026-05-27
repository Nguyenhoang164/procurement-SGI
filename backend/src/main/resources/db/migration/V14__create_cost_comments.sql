CREATE TABLE cost_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id BIGINT NOT NULL,
  expected_cost_vnd DECIMAL(15,0),
  actual_cost_vnd DECIMAL(15,0),
  variance_amount_vnd DECIMAL(15,0),
  content TEXT,
  type VARCHAR(50),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
