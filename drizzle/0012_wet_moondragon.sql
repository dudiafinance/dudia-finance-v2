CREATE INDEX "card_transactions_user_id_idx" ON "card_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_transactions_date_idx" ON "card_transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "card_transactions_user_id_date_idx" ON "card_transactions" USING btree ("user_id","date");