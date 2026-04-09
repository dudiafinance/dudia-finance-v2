CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "budgets_user_active_idx" ON "budgets" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "credit_cards_user_id_idx" ON "credit_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goal_contributions_goal_month_idx" ON "goal_contributions" USING btree ("goal_id","month","year");--> statement-breakpoint
CREATE INDEX "recurring_user_id_idx" ON "recurring_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_next_due_idx" ON "recurring_transactions" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires");