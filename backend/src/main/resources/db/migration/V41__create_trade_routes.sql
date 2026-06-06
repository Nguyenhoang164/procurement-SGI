CREATE TABLE trade_routes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL UNIQUE,
  origin VARCHAR(100),
  destination VARCHAR(100),
  description VARCHAR(500),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL
);

INSERT INTO trade_routes (route_name, origin, destination, description) VALUES
('Trung - Philipin', 'Trung Quốc', 'Philippines', 'Tuyến hàng từ Trung Quốc sang Philippines'),
('Trung - Việt Nam', 'Trung Quốc', 'Việt Nam', 'Tuyến hàng từ Trung Quốc về Việt Nam'),
('Việt Nam - Philipin', 'Việt Nam', 'Philippines', 'Tuyến hàng từ Việt Nam sang Philippines');

ALTER TABLE weekly_plans ADD COLUMN trade_route VARCHAR(100) DEFAULT NULL AFTER country;
ALTER TABLE weekly_plan_items ADD COLUMN trade_route VARCHAR(100) DEFAULT NULL AFTER country;
