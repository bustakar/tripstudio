CREATE TABLE "trip_plan_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_plan_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_plan_revisions" ADD CONSTRAINT "trip_plan_revisions_trip_plan_id_trip_plans_id_fk" FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trip_plan_revisions_plan_version_idx" ON "trip_plan_revisions" USING btree ("trip_plan_id","version");--> statement-breakpoint
CREATE FUNCTION "capture_trip_plan_revision"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	INSERT INTO "trip_plan_revisions" ("trip_plan_id", "version", "snapshot", "created_at")
	VALUES (
		NEW."id",
		NEW."version",
		jsonb_build_object(
			'title', NEW."title",
			'startDate', NEW."start_date",
			'endDate', NEW."end_date",
			'status', NEW."status",
			'planningBrief', NEW."planning_brief",
			'document', NEW."document"
		),
		NEW."updated_at"
	);
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "capture_trip_plan_revision" AFTER INSERT OR UPDATE ON "trip_plans" FOR EACH ROW EXECUTE FUNCTION "capture_trip_plan_revision"();--> statement-breakpoint
INSERT INTO "trip_plan_revisions" ("trip_plan_id", "version", "snapshot", "created_at")
SELECT
	"id",
	"version",
	jsonb_build_object(
		'title', "title",
		'startDate', "start_date",
		'endDate', "end_date",
		'status', "status",
		'planningBrief', "planning_brief",
		'document', "document"
	),
	"updated_at"
FROM "trip_plans"
ON CONFLICT ("trip_plan_id", "version") DO NOTHING;
