-- Custom SQL migration file, put your code below! --
-- Replace is_recurring boolean with subtype varchar in transactions
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subtype" varchar(20) DEFAULT 'single';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "recurring_group_id" uuid;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "total_occurrences" integer;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "current_occurrence" integer;
-- Update existing recurring transactions
UPDATE "transactions" SET "subtype" = 'recurring' WHERE "is_recurring" = true;
-- Drop old column
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_recurring";

-- Add monthly_contribution to goals
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "monthly_contribution" numeric(15, 2);
