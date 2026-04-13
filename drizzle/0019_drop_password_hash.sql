CREATE INDEX "transactions_recurring_group_idx" ON "transactions" USING btree ("recurring_group_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";