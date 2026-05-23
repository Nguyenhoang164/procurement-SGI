CREATE TABLE exchange_rate_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  currency VARCHAR(10) NOT NULL UNIQUE,
  rate DECIMAL(12,4) NOT NULL,
  updated_at TIMESTAMP NULL
);

INSERT INTO exchange_rate_config (currency, rate) VALUES ('CNY', 3520);
INSERT INTO exchange_rate_config (currency, rate) VALUES ('USD', 25400);
