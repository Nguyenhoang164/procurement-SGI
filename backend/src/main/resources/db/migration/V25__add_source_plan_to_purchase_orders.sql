ALTER TABLE purchase_orders
  ADD COLUMN source_plan_id BIGINT NULL AFTER po_code;

ALTER TABLE purchase_orders
  ADD CONSTRAINT fk_purchase_orders_source_plan
  FOREIGN KEY (source_plan_id) REFERENCES weekly_plans(id);
