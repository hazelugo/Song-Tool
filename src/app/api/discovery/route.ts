import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { and, isNull, gte, lte, eq, ilike, exists, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { parsePrompt } from "@/lib/parse-prompt";
import { requireUser } from "@/lib/auth";

const requestSchema = z.object({ prompt: z.string().min(1).max(500) });

export async function GET() {
  return NextResponse.json({ aiAvailable: true });
}

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const filters = parsePrompt(parsed.data.prompt);

    // Base structural conditions (BPM, key, mode, time sig) — always applied
    const baseConditions: SQL[] = [isNull(songs.deletedAt), eq(songs.userId, userId)];
    if (filters.bpmMin !== undefined) baseConditions.push(gte(songs.bpm, filters.bpmMin));
    if (filters.bpmMax !== undefined) baseConditions.push(lte(songs.bpm, filters.bpmMax));
    if (filters.key) baseConditions.push(eq(songs.musicalKey, filters.key as any));
    if (filters.keySig) baseConditions.push(eq(songs.keySignature, filters.keySig as any));
    if (filters.timeSig) baseConditions.push(eq(songs.timeSignature, filters.timeSig as any));

    // Build searchTerm condition (matches name, lyrics, tags)
    let searchCondition: SQL | undefined;
    if (filters.searchTerm) {
      const term = filters.searchTerm;
      const words = term.split(/\s+/).filter((w) => w.length > 1);
      const tagExistsConditions = words.map((word) =>
        exists(
          db
            .select({ id: sql<number>`1` })
            .from(tags)
            .where(and(eq(tags.songId, songs.id), ilike(tags.name, `%${word}%`))),
        ),
      );
      searchCondition = or(
        ilike(songs.name, `%${term}%`),
        sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${term})`,
        ...tagExistsConditions,
      )!;
    }

    // Pass 1: structural + searchTerm
    // Pass 2: structural only (fallback if searchTerm matched nothing)
    let results = await db.query.songs.findMany({
      where: and(...baseConditions, ...(searchCondition ? [searchCondition] : [])),
      with: { tags: true },
      orderBy: (songs, { desc }) => [desc(songs.createdAt)],
    });

    if (results.length === 0 && searchCondition) {
      results = await db.query.songs.findMany({
        where: and(...baseConditions),
        with: { tags: true },
        orderBy: (songs, { desc }) => [desc(songs.createdAt)],
      });
    }

    return NextResponse.json({ results, parsedFilters: filters });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/discovery error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
