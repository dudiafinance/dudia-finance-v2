CREATE TABLE "goal_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"original_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "target_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "monthly_contribution" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "goal_type" varchar(20) DEFAULT 'target';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "subtype" varchar(20) DEFAULT 'single';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "recurring_group_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "total_occurrences" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "current_occurrence" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_id_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_transactions_user_id_idx" ON "card_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_transactions_card_id_idx" ON "card_transactions" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "card_transactions_invoice_idx" ON "card_transactions" USING btree ("invoice_month","invoice_year");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "goals" DROP COLUMN "deadline";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "is_recurring";