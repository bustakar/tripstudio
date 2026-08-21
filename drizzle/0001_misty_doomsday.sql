CREATE TABLE "trip_plan_document_backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_plan_id" uuid NOT NULL,
	"from_schema_version" integer NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_plan_document_backups" ADD CONSTRAINT "trip_plan_document_backups_trip_plan_id_trip_plans_id_fk" FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trip_plan_document_backups_plan_version_idx" ON "trip_plan_document_backups" USING btree ("trip_plan_id","from_schema_version");