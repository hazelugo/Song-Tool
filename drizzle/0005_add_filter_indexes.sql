CREATE INDEX "idx_songs_musical_key" ON "songs" USING btree ("musical_key");--> statement-breakpoint
CREATE INDEX "idx_songs_key_signature" ON "songs" USING btree ("key_signature");--> statement-breakpoint
CREATE INDEX "idx_songs_time_signature" ON "songs" USING btree ("time_signature");