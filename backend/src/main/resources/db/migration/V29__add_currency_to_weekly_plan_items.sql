ALTER TABLE weekly_plan_items 
ADD COLUMN currency VARCHAR(10) DEFAULT 'CNY' AFTER reference_price;
