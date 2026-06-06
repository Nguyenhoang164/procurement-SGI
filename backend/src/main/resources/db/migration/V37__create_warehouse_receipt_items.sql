CREATE TABLE warehouse_receipt_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    po_item_id BIGINT NOT NULL,
    received_qty INT NOT NULL,
    goods_condition VARCHAR(50),
    condition_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_id FOREIGN KEY (receipt_id) REFERENCES warehouse_receipts(id),
    CONSTRAINT fk_po_item_id FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id)
);
