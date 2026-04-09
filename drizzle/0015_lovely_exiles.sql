ALTER TABLE "accounts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deleted_at" timestamp;