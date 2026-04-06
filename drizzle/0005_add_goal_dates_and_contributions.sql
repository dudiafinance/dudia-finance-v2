-- Add start_date and end_date columns to goals table
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "start_date" date;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "end_date" date;

-- Make start_date NOT NULL after adding default
ALTER TABLE "goals" ALTER COLUMN "start_date" SET NOT NULL;

-- Create goal_contributions table
CREATE TABLE IF NOT EXISTS "goal_contributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "goal_id" uuid NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "month" integer NOT NULL,
  "year" integer NOT NULL,
  "amount" decimal(15,2) NOT NULL,
  "original_amount" decimal(15,2) NOT NULL,
  "status" varchar(20) DEFAULT 'pending',
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "goal_contributions_goal_id_idx" ON "goal_contributions"("goal_id");
CREATE INDEX IF NOT EXISTS "goal_contributions_user_id_idx" ON "goal_contributions"("user_id");
CREATE INDEX IF NOT EXISTS "goal_contributions_month_year_idx" ON "goal_contributions"("month", "year");