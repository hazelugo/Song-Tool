import { SQL, sql, relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  index,
  customType,
  primaryKey,
} from "drizzle-orm/pg-core";

// Custom tsvector type — not natively supported in Drizzle
export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Enums — 17 values covering all 12 keys with enharmonic equivalents
export const musicalKeyEnum = pgEnum("musical_key", [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
]);
export const keySignatureEnum = pgEnum("key_signature", ["major", "minor"]);

// Common time signatures in x/y notation
export const timeSignatureEnum = pgEnum("time_signature", [
  "4/4",
  "3/4",
  "2/4",
  "2/2",
  "6/8",
  "9/8",
  "12/8",
  "5/4",
  "7/8",
  "7/4",
  "3/8",
  "6/4",
]);

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    bpm: integer("bpm").notNull(),
    musicalKey: musicalKeyEnum("musical_key").notNull(),
    keySignature: keySignatureEnum("key_signature").notNull(),
    timeSignature: timeSignatureEnum("time_signature").notNull().default("4/4"),
    chordProgressions: jsonb("chord_progressions")
      .$type<string[]>()
      .notNull()
      .default([]),
    lyrics: text("lyrics"),
    youtubeUrl: text("youtube_url"),
    spotifyUrl: text("spotify_url"),
    lyricsSearch: tsvector("lyrics_search").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', coalesce(${songs.lyrics}, ''))`,
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"), // soft delete
  },
  (t) => [index("idx_songs_lyrics_search").using("gin", t.lyricsSearch)],
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId: uuid("song_id")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const playlistSongs = pgTable(
  "playlist_songs",
  {
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id), // no cascade: soft-deleted songs stay in playlists
    position: real("position").notNull(), // fractional indexing — single-row UPDATE per drag reorder
  },
  (t) => [primaryKey({ columns: [t.playlistId, t.songId] })],
);

// TypeScript type exports — used by all feature phases
export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type PlaylistSong = typeof playlistSongs.$inferSelect;

export const songsRelations = relations(songs, ({ many }) => ({
  tags: many(tags),
}));

export const tagsRelations = relations(tags, ({ one }) => ({
  song: one(songs, { fields: [tags.songId], references: [songs.id] }),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  songs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  song: one(songs, { fields: [playlistSongs.songId], references: [songs.id] }),
}));

export type SongWithTags = Song & { tags: Tag[] };
