CREATE TABLE "card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"invoice_month" integer NOT NULL,
	"invoice_year" integer NOT NULL,
	"launch_type" varchar(20) NOT NULL,
	"total_installments" integer,
	"current_installment" integer,
	"group_id" uuid,
	"tags" jsonb,
	"is_pending" boolean DEFAULT false,
	"is_fixed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"bank" varchar(100) NOT NULL,
	"last_digits" varchar(4),
	"limit" numeric(15, 2) NOT NULL,
	"used_amount" numeric(15, 2) DEFAULT '0',
	"due_day" integer NOT NULL,
	"closing_day" integer NOT NULL,
	"color" varchar(7) DEFAULT '#820AD1',
	"gradient" varchar(100) DEFAULT 'from-[#820AD1] to-[#4B0082]',
	"network" varchar(20) DEFAULT 'mastercard',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_card_id_credit_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."credit_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;