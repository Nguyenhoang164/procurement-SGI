CREATE TABLE bank_accounts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_number  VARCHAR(100) NOT NULL,
    account_holder  VARCHAR(200) NOT NULL,
    bank_name       VARCHAR(200) NOT NULL,
    qr_code         VARCHAR(500),
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE payment_requests
    ADD COLUMN reference_payment_request_id BIGINT NULL AFTER updated_at,
    ADD COLUMN bank_account_id BIGINT NULL AFTER reference_payment_request_id,
    ADD INDEX idx_pr_reference (reference_payment_request_id),
    ADD INDEX idx_pr_bank_account (bank_account_id);
