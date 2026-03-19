import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { and, isNull, eq, notInArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getKeyCompatibility } from "@/lib/camelot";
import type { SongWithTags } from "@/db/schema";

const LANGUAGE_TAGS = ["spanish", "english"];

function getLanguageTag(song: SongWithTags): string | null {
  const found = song.tags.find((t) =>
    LANGUAGE_TAGS.includes(t.name.toLowerCase()),
  );
  return found ? found.name.toLowerCase() : null;
}

function scoreSimilarity(seed: SongWithTags, candidate: SongWithTags): number {
  // Key compatibility (0–3), weighted x2
  const keyCompat = getKeyCompatibility(
    seed.musicalKey,
    seed.keySignature,
    candidate.musicalKey,
    candidate.keySignature,
  );
  const keyScore = keyCompat.score * 2;

  // BPM proximity
  let bpmScore = 0;
  if (seed.bpm && candidate.bpm) {
    const ratio = Math.abs(seed.bpm - candidate.bpm) / seed.bpm;
    if (ratio <= 0.1) bpmScore = 2;
    else if (ratio <= 0.2) bpmScore = 1;
  }

  // Shared non-language tags (capped at 2)
  const seedTagSet = new Set(
    seed.tags
      .filter((t) => !LANGUAGE_TAGS.includes(t.name.toLowerCase()))
      .map((t) => t.name.toLowerCase()),
  );
  const sharedTags = candidate.tags.filter(
    (t) =>
      !LANGUAGE_TAGS.includes(t.name.toLowerCase()) &&
      seedTagSet.has(t.name.toLowerCase()),
  ).length;
  const tagBonus = Math.min(sharedTags, 2);

  return keyScore + bpmScore + tagBonus;
}

export async function GET(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("songId");
  const excludeParam = searchParams.get("exclude") ?? "";

  if (!songId) {
    return NextResponse.json({ error: "songId required" }, { status: 400 });
  }

  const excludeIds = [
    songId,
    ...excludeParam.split(",").filter((id) => id.trim()),
  ];

  try {
    const seed = await db.query.songs.findFirst({
      where: and(
        isNull(songs.deletedAt),
        eq(songs.userId, userId),
        eq(songs.id, songId),
      ),
      with: { tags: true },
    });

    if (!seed) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const candidates = await db.query.songs.findMany({
      where: and(
        isNull(songs.deletedAt),
        eq(songs.userId, userId),
        notInArray(songs.id, excludeIds),
      ),
      with: { tags: true },
    });

    // Hard-filter by language if the seed has one
    const seedLang = getLanguageTag(seed);
    const filtered = seedLang
      ? candidates.filter((s) => getLanguageTag(s) === seedLang)
      : candidates;

    const results = filtered
      .map((s) => ({ song: s, score: scoreSimilarity(seed, s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ song }) => song);

    return NextResponse.json({ seed, results });
  } catch (err) {
    console.error("GET /api/similar error:", err);
    return NextResponse.json(
      { error: "Failed to find similar songs" },
      { status: 500 },
    );
  }
}
