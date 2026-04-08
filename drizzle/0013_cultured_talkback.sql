CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#820AD1',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "goal_id" uuid;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_transactions_user_card_invoice_idx" ON "card_transactions" USING btree ("user_id","card_id","invoice_month","invoice_year");--> statement-breakpoint
CREATE INDEX "card_transactions_user_invoice_idx" ON "card_transactions" USING btree ("user_id","invoice_month","invoice_year");--> statement-breakpoint
CREATE INDEX "card_transactions_user_cat_date_idx" ON "card_transactions" USING btree ("user_id","category_id","date");--> statement-breakpoint
CREATE INDEX "categories_user_parent_idx" ON "categories" USING btree ("user_id","parent_id");--> statement-breakpoint
CREATE INDEX "goal_contributions_user_id_idx" ON "goal_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_contributions_goal_id_idx" ON "goal_contributions" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "transactions_account_ispaid_idx" ON "transactions" USING btree ("account_id","is_paid");--> statement-breakpoint
CREATE INDEX "transactions_account_date_idx" ON "transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "transactions_user_cat_date_idx" ON "transactions" USING btree ("user_id","category_id","date");