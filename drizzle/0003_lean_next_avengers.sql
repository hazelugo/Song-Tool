ALTER TYPE "public"."time_signature" ADD VALUE IF NOT EXISTS '3/8';--> statement-breakpoint
ALTER TYPE "public"."time_signature" ADD VALUE IF NOT EXISTS '6/4';--> statement-breakpoint
CREATE INDEX "idx_playlist_songs_playlist_id" ON "playlist_songs" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "idx_playlists_user_id" ON "playlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tags_song_id" ON "tags" USING btree ("song_id");