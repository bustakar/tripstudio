CREATE TABLE "trip_plan_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_plan_id" uuid NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_plan_members" (
	"trip_plan_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_plan_members_trip_plan_id_user_id_pk" PRIMARY KEY("trip_plan_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "trip_plan_invitations" ADD CONSTRAINT "trip_plan_invitations_trip_plan_id_trip_plans_id_fk" FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_plan_members" ADD CONSTRAINT "trip_plan_members_trip_plan_id_trip_plans_id_fk" FOREIGN KEY ("trip_plan_id") REFERENCES "public"."trip_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trip_plan_invitations_token_hash_idx" ON "trip_plan_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "trip_plan_invitations_plan_idx" ON "trip_plan_invitations" USING btree ("trip_plan_id");--> statement-breakpoint
CREATE INDEX "trip_plan_members_user_idx" ON "trip_plan_members" USING btree ("user_id");
