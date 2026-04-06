ALTER TABLE "categories" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "receive_date" date;