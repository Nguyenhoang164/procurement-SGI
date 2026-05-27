CREATE TABLE waybills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  waybill_code VARCHAR(100) NOT NULL,
  carrier VARCHAR(100),
  origin VARCHAR(100),
  destination VARCHAR(100),
  expected_qty INT,
  actual_qty INT,
  status VARCHAR(50),
  note VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE TABLE shipment_trackings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  waybill_id BIGINT NOT NULL,
  location VARCHAR(200),
  event_description VARCHAR(500),
  event_date TIMESTAMP,
  status VARCHAR(50),
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
