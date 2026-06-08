ALTER TABLE products ADD COLUMN vietnamese_name VARCHAR(255) DEFAULT NULL AFTER product_name;
ALTER TABLE products ADD COLUMN old_pos_code VARCHAR(150) DEFAULT NULL AFTER pos_code;
