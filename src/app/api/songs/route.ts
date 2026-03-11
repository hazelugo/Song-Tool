import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { songApiSchema } from "@/lib/validations/song";

function parseChordProgressions(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const result = await db.query.songs.findMany({
      where: isNull(songs.deletedAt),
      with: { tags: true },
      orderBy: (songs, { desc }) => [desc(songs.createdAt)],
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/songs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
        .values({ ...songData, chordProgressions })
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
