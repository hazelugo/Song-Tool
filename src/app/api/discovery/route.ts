import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { and, isNull, gte, lte, eq, ilike, exists, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";

const schema = z.object({ prompt: z.string().min(1).max(500) });

// Mood keywords → BPM range hints
const MOOD_BPM = [
  {
    keywords: ["upbeat", "fast", "energetic", "dance", "workout", "hype", "pump", "high energy"],
    bpmMin: 120,
  },
  {
    keywords: ["slow", "ballad", "chill", "relaxed", "mellow", "calm", "soft", "peaceful"],
    bpmMax: 90,
  },
  {
    keywords: ["medium", "moderate", "mid-tempo", "midtempo"],
    bpmMin: 90,
    bpmMax: 130,
  },
] as const;

// Words to strip from the remaining search term
const STOP_WORDS =
  /\b(songs?|tracks?|music|in|the|of|with|for|a|an|and|or|that|are|is|key|my|i|want|find|show|me|some|give|feel|have|which|like|similar|about|by)\b/gi;

function parsePrompt(prompt: string): {
  key?: string;
  keySig?: "major" | "minor";
  timeSig?: string;
  bpmMin?: number;
  bpmMax?: number;
  searchTerm?: string;
} {
  const lower = prompt.toLowerCase();
  let remaining = prompt;
  const result: ReturnType<typeof parsePrompt> = {};

  // 1. Time signature — match fraction-style strings first
  const timeSigMatch = remaining.match(
    /\b(12\/8|9\/8|6\/8|7\/4|7\/8|5\/4|4\/4|3\/4|2\/4|2\/2)\b/,
  );
  if (timeSigMatch && TIME_SIGNATURES.includes(timeSigMatch[1] as (typeof TIME_SIGNATURES)[number])) {
    result.timeSig = timeSigMatch[1];
    remaining = remaining.replace(timeSigMatch[0], " ");
  }

  // 2. Key signature
  if (/\bminor\b/i.test(remaining)) {
    result.keySig = "minor";
    remaining = remaining.replace(/\bminor\b/gi, " ");
  } else if (/\bmajor\b/i.test(remaining)) {
    result.keySig = "major";
    remaining = remaining.replace(/\bmajor\b/gi, " ");
  }

  // 3. Musical key — multi-char keys first to avoid consuming part of "C#" as "C"
  const sortedKeys = [...MUSICAL_KEYS].sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    // Escape # for use in regex
    const escaped = k.replace("#", "\\#");
    // Single-char keys (C D E F G A B) need case-sensitive boundary match to avoid
    // false positives from words like "for" containing "f", "and" containing "a", etc.
    // We look for them only when surrounded by non-word chars or at string boundaries.
    const pattern =
      k.length === 1
        ? new RegExp(`(?<![A-Za-z])${escaped}(?![a-z])`) // uppercase only, not inside a word
        : new RegExp(`\\b${escaped}\\b`, "i");

    if (pattern.test(remaining)) {
      result.key = k;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // 4. Explicit BPM number ("120 bpm", "90bpm")
  const bpmMatch = remaining.match(/\b(\d{2,3})\s*bpm\b/i);
  if (bpmMatch) {
    const bpm = parseInt(bpmMatch[1], 10);
    if (bpm >= 1 && bpm <= 500) {
      result.bpmMin = Math.max(1, bpm - 5);
      result.bpmMax = Math.min(500, bpm + 5);
    }
    remaining = remaining.replace(bpmMatch[0], " ");
  } else {
    // 5. Mood keywords → BPM range
    for (const { keywords, ...bpms } of MOOD_BPM) {
      if (keywords.some((kw) => lower.includes(kw))) {
        if ("bpmMin" in bpms) result.bpmMin = bpms.bpmMin;
        if ("bpmMax" in bpms) result.bpmMax = bpms.bpmMax;
        break;
      }
    }
  }

  // 6. Whatever remains (after stripping stop words) becomes the text search term
  const cleaned = remaining.replace(STOP_WORDS, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length > 1) {
    result.searchTerm = cleaned;
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { prompt } = parsed.data;
    const filters = parsePrompt(prompt);

    const conditions: SQL[] = [isNull(songs.deletedAt)];

    if (filters.bpmMin !== undefined) conditions.push(gte(songs.bpm, filters.bpmMin));
    if (filters.bpmMax !== undefined) conditions.push(lte(songs.bpm, filters.bpmMax));
    if (filters.key) conditions.push(eq(songs.musicalKey, filters.key as any));
    if (filters.keySig) conditions.push(eq(songs.keySignature, filters.keySig as any));
    if (filters.timeSig) conditions.push(eq(songs.timeSignature, filters.timeSig as any));

    if (filters.searchTerm) {
      const term = filters.searchTerm;
      // Split into individual words so "acoustic ballad" matches songs tagged
      // "acoustic" OR "ballad" rather than requiring the exact phrase as a tag name.
      const words = term.split(/\s+/).filter((w) => w.length > 1);
      const tagExistsConditions = words.map((word) =>
        exists(
          db
            .select({ id: sql<number>`1` })
            .from(tags)
            .where(and(eq(tags.songId, songs.id), ilike(tags.name, `%${word}%`))),
        ),
      );

      conditions.push(
        or(
          ilike(songs.name, `%${term}%`),
          sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${term})`,
          ...tagExistsConditions,
        )!,
      );
    }

    const result = await db.query.songs.findMany({
      where: and(...conditions),
      with: { tags: true },
      orderBy: (songs, { desc }) => [desc(songs.createdAt)],
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/discovery error:", err);
    return NextResponse.json(
      { error: "Failed to process search" },
      { status: 500 },
    );
  }
}
