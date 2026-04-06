-- Make targetAmount nullable for goals without total target
ALTER TABLE "goals" ALTER COLUMN "target_amount" DROP NOT NULL;

-- Add goalType column to distinguish between target-based and monthly-based goals
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "goal_type" varchar(20) DEFAULT 'target';

-- Update existing goals to set goalType based on monthlyContribution
UPDATE "goals" SET goal_type = CASE 
  WHEN monthly_contribution IS NOT NULL AND target_amount IS NULL THEN 'monthly'
  ELSE 'target'
END;