ALTER TABLE "songs" ADD COLUMN "user_id" uuid DEFAULT 'f47ac10b-58cc-4372-a567-0e02b2c3d479' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_songs_user_id" ON "songs" USING btree ("user_id");