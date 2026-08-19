CREATE TABLE "trip_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"start_date" text,
	"end_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"planning_brief" text DEFAULT '' NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trip_plans_owner_updated_idx" ON "trip_plans" USING btree ("owner_id","updated_at");
