CREATE TABLE "automation_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"enabled" boolean DEFAULT false,
	"auto_message_new_lead" boolean DEFAULT true,
	"auto_followup_3_days" boolean DEFAULT true,
	"auto_followup_7_days" boolean DEFAULT false,
	"preferred_channel" text DEFAULT 'whatsapp',
	"quiet_hours_start" integer DEFAULT 21,
	"quiet_hours_end" integer DEFAULT 9,
	"casafari_enabled" boolean DEFAULT false,
	"casafari_search_params" jsonb,
	"casafari_schedule" text DEFAULT 'daily',
	"new_lead_template_id" varchar,
	"followup_template_id" varchar,
	"search_enabled" boolean DEFAULT false,
	"search_sources" jsonb DEFAULT '["casafari","idealista","olx"]'::jsonb,
	"search_locations" jsonb DEFAULT '["Lisboa","Porto"]'::jsonb,
	"search_property_types" jsonb DEFAULT '["Apartamento","Moradia"]'::jsonb,
	"search_transaction_type" text DEFAULT 'sale',
	"search_price_min" integer DEFAULT 100000,
	"search_price_max" integer DEFAULT 500000,
	"search_bedrooms" integer,
	"search_area_min" integer,
	"search_area_max" integer,
	"search_schedule" text DEFAULT 'daily',
	"search_min_score" integer DEFAULT 40,
	"auto_classify_leads" boolean DEFAULT true,
	"auto_contact_new_leads" boolean DEFAULT false,
	"last_search_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "automation_settings_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar,
	"lead_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"event_type" text DEFAULT 'visita',
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "configurations_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"password" text,
	"tax_id" text,
	"stripe_customer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'trial',
	"trial_ends_at" timestamp,
	"email_verified" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"google_access_token" text,
	"google_refresh_token" text,
	"google_token_expiry" timestamp,
	"google_calendar_connected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "interaction_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" text NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"property" text NOT NULL,
	"property_type" text NOT NULL,
	"location" text NOT NULL,
	"price" text NOT NULL,
	"status" text DEFAULT 'frio' NOT NULL,
	"qualification" text DEFAULT 'pendente_visita',
	"owner_type" text DEFAULT 'particular',
	"source" text NOT NULL,
	"source_url" text,
	"contact" text NOT NULL,
	"email" text,
	"ai_score" integer,
	"ai_reasoning" text,
	"notes" text,
	"opt_out" boolean DEFAULT false,
	"customer_id" varchar,
	"last_contact" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"lead_id" varchar NOT NULL,
	"channel" text NOT NULL,
	"template_id" varchar,
	"content" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"attempts" integer DEFAULT 0,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"variables" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar,
	"subscription_id" varchar,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text NOT NULL,
	"payment_method_details" jsonb,
	"stripe_payment_id" text,
	"description" text,
	"invoice_number" text,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"refunded_at" timestamp,
	"refund_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"plan_id" text NOT NULL,
	"plan_name" text NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"stripe_subscription_id" text,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"metric" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"period" text NOT NULL,
	"source" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_settings" ADD CONSTRAINT "automation_settings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_history" ADD CONSTRAINT "interaction_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_jobs" ADD CONSTRAINT "message_jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_jobs" ADD CONSTRAINT "message_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;