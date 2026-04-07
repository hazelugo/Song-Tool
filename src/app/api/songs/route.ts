import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { isNull, count } from "drizzle-orm";
import { and, gte, lte, eq, ilike, exists, sql, asc, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { filterSchema } from "@/lib/validations/filter";
import { songApiSchema } from "@/lib/validations/song"; // Keep for POST
import { requireUser } from "@/lib/auth";

const PAGE_SIZE = 25;

function parseChordProgressions(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Validate and coerce filter params — invalid values are ignored (safeParse)
    const parsed = filterSchema.safeParse(Object.fromEntries(searchParams));
    const f = parsed.success ? parsed.data : {};

    const conditions: SQL[] = [isNull(songs.deletedAt), eq(songs.userId, userId)];

    if (f.bpmMin !== undefined) conditions.push(gte(songs.bpm, f.bpmMin));
    if (f.bpmMax !== undefined) conditions.push(lte(songs.bpm, f.bpmMax));
    if (f.key) conditions.push(eq(songs.musicalKey, f.key as any));
    if (f.keySig) conditions.push(eq(songs.keySignature, f.keySig as any));
    if (f.timeSig) conditions.push(eq(songs.timeSignature, f.timeSig as any));

    if (f.chord) {
      conditions.push(
        sql`${songs.chordProgressions}::text ILIKE ${"%" + f.chord + "%"}`,
      );
    }

    if (f.lyric) {
      // Search both song title (ILIKE) and lyrics (FTS). OR so either match returns the song.
      // Use websearch_to_tsquery for lyrics — NOT to_tsquery, which fails on raw user input.
      conditions.push(
        sql`(${songs.name} ILIKE ${"%" + f.lyric + "%"} OR ${songs.artist} ILIKE ${"%" + f.lyric + "%"} OR ${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${f.lyric}))`,
      );
    }

    if (f.artist) {
      conditions.push(ilike(songs.artist, "%" + f.artist + "%"));
    }

    if (f.tag) {
      // Use EXISTS subquery — NOT INNER JOIN. JOIN would duplicate rows when
      // a song has multiple tags that both match (e.g. tag="a" matches "ballad" AND "anthem")
      const tagSq = db
        .select({ id: sql<number>`1` })
        .from(tags)
        .where(and(eq(tags.songId, songs.id), ilike(tags.name, f.tag)));
      conditions.push(exists(tagSq));
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limitParam = searchParams.get("limit");
    const pageSize = limitParam ? Math.min(1000, Math.max(1, parseInt(limitParam, 10))) : PAGE_SIZE;
    const whereClause = and(...conditions);

    const sortColMap = {
      name: songs.name,
      bpm: songs.bpm,
      musicalKey: songs.musicalKey,
      keySignature: songs.keySignature,
      timeSignature: songs.timeSignature,
      createdAt: songs.createdAt,
    } as const;
    const sortCol = sortColMap[f.sort ?? "createdAt"] ?? songs.createdAt;
    const orderByClause = (f.sortDir ?? "desc") === "asc" ? asc(sortCol) : desc(sortCol);

    const [[{ total }], data] = await Promise.all([
      db.select({ total: count() }).from(songs).where(whereClause),
      db.query.songs.findMany({
        where: whereClause,
        with: { tags: true },
        orderBy: orderByClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    console.error("GET /api/songs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = songApiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const {
      tags: tagNames,
      chordProgressions: rawChords,
      ...songData
    } = parsed.data;
    const chordProgressions = parseChordProgressions(rawChords);

    const newSong = await db.transaction(async (tx) => {
      const [song] = await tx
        .insert(songs)
        .values({ ...songData, chordProgressions, userId })
        .returning();
      const normalizedTags = [
        ...new Set(tagNames.map((t) => t.toLowerCase().trim())),
      ].filter(Boolean);
      if (normalizedTags.length > 0) {
        await tx
          .insert(tags)
          .values(normalizedTags.map((name) => ({ songId: song.id, name })));
      }
      return song;
    });

    return NextResponse.json(newSong, { status: 201 });
  } catch (err) {
    console.error("POST /api/songs error:", err);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500 },
    );
  }
}
