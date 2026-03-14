DO $$ BEGIN
  CREATE TYPE "public"."time_signature" AS ENUM('4/4', '3/4', '2/4', '2/2', '6/8', '9/8', '12/8', '5/4', '7/8', '7/4');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN IF NOT EXISTS "time_signature" time_signature DEFAULT '4/4' NOT NULL;
