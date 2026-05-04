import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { isNull, count } from "drizzle-orm";
import { and, gte, lte, eq, ilike, exists, sql, asc, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { filterSchema, type FilterParams } from "@/lib/validations/filter";
import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";
import { requireUser } from "@/lib/auth";
import { errMsg } from "@/lib/utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    bpmMin: { type: "number", description: "Minimum BPM (1–500)" },
    bpmMax: { type: "number", description: "Maximum BPM (1–500)" },
    key: { type: "string", enum: [...MUSICAL_KEYS], description: "Musical key" },
    keySig: { type: "string", enum: ["major", "minor"], description: "Key signature" },
    timeSig: { type: "string", enum: [...TIME_SIGNATURES], description: "Time signature" },
    chord: { type: "string", description: "Chord name to search within progressions" },
    tag: { type: "string", description: "Tag to filter by (genre, feel, etc.)" },
    artist: { type: "string", description: "Artist name" },
    lyric: { type: "string", description: "Keyword to search in song title, lyrics, or tags" },
    interpretation: {
      type: "string",
      description: "Brief human-readable summary of what was understood from the query",
    },
  },
  required: ["interpretation"],
};

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a music catalog search assistant. Given a natural language query about songs, extract structured filter parameters as JSON. Use musical knowledge to infer sensible BPM ranges (e.g. 'upbeat' → bpmMin: 120, 'slow' → bpmMax: 80), keys, and modes. Only set fields clearly implied by the query — omit everything else.",
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    let raw: FilterParams & { interpretation?: string };
    try {
      raw = JSON.parse(response.text ?? "{}");
    } catch {
      return NextResponse.json({ error: "Failed to parse query" }, { status: 500 });
    }

    const { interpretation, ...filterRaw } = raw;
    const parsed = filterSchema.safeParse(filterRaw);
    const filters = parsed.success ? parsed.data : {};

    // Build DB query using the same logic as GET /api/songs
    const conditions: SQL[] = [isNull(songs.deletedAt), eq(songs.userId, userId)];

    if (filters.bpmMin !== undefined) conditions.push(gte(songs.bpm, filters.bpmMin));
    if (filters.bpmMax !== undefined) conditions.push(lte(songs.bpm, filters.bpmMax));
    if (filters.key) conditions.push(eq(songs.musicalKey, filters.key as any));
    if (filters.keySig) conditions.push(eq(songs.keySignature, filters.keySig as any));
    if (filters.timeSig) conditions.push(eq(songs.timeSignature, filters.timeSig as any));
    if (filters.chord) {
      conditions.push(sql`${songs.chordProgressions}::text ILIKE ${"%" + filters.chord + "%"}`);
    }
    if (filters.lyric) {
      const tagSq = db
        .select({ id: sql<number>`1` })
        .from(tags)
        .where(and(eq(tags.songId, songs.id), ilike(tags.name, "%" + filters.lyric + "%")));
      conditions.push(
        sql`(${songs.name} ILIKE ${"%" + filters.lyric + "%"} OR ${songs.artist} ILIKE ${"%" + filters.lyric + "%"} OR ${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${filters.lyric}) OR ${exists(tagSq)})`,
      );
    }
    if (filters.artist) conditions.push(ilike(songs.artist, "%" + filters.artist + "%"));
    if (filters.tag) {
      const tagSq = db
        .select({ id: sql<number>`1` })
        .from(tags)
        .where(and(eq(tags.songId, songs.id), ilike(tags.name, filters.tag)));
      conditions.push(exists(tagSq));
    }

    const whereClause = and(...conditions);
    const sortCol = filters.sort ? songs[filters.sort as keyof typeof songs] as any : songs.createdAt;
    const orderByClause = (filters.sortDir ?? "desc") === "asc" ? asc(sortCol) : desc(sortCol);

    const [[{ total }], data] = await Promise.all([
      db.select({ total: count() }).from(songs).where(whereClause),
      db.query.songs.findMany({
        where: whereClause,
        with: { tags: true },
        orderBy: orderByClause,
        limit: 50,
      }),
    ]);

    return NextResponse.json({ filters, interpretation: interpretation ?? "", songs: data, total });
  } catch (err) {
    console.error("POST /api/discovery error:", err);
    return NextResponse.json(
      { error: "Failed to process discovery query", detail: errMsg(err) },
      { status: 500 },
    );
  }
}
