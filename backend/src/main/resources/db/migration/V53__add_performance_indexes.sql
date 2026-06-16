CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_dept ON purchase_orders(initiator_department);
CREATE INDEX idx_purchase_orders_po_code ON purchase_orders(po_code);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX idx_purchase_orders_payment_status ON purchase_orders(payment_status);
CREATE INDEX idx_purchase_order_items_pos_code ON purchase_order_items(pos_code);
