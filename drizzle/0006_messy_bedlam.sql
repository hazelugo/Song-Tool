ALTER TABLE "songs" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_songs_bpm" ON "songs" USING btree ("bpm");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_songs_artist" ON "songs" USING btree ("artist");