import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { songApiSchema } from "@/lib/validations/song";
import { z } from "zod";

function parseChordProgressions(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const bulkSchema = z.object({
  songs: z.array(songApiSchema).min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    let imported = 0;

    await db.transaction(async (tx) => {
      for (const songData of parsed.data.songs) {
        const { tags: tagNames, chordProgressions: rawChords, ...rest } = songData;
        const chordProgressions = parseChordProgressions(rawChords ?? "");

        const [song] = await tx
          .insert(songs)
          .values({ ...rest, chordProgressions })
          .returning();

        const normalizedTags = [
          ...new Set(tagNames.map((t) => t.toLowerCase().trim())),
        ].filter(Boolean);
        if (normalizedTags.length > 0) {
          await tx
            .insert(tags)
            .values(normalizedTags.map((name) => ({ songId: song.id, name })));
        }
        imported++;
      }
    });

    return NextResponse.json({ imported }, { status: 201 });
  } catch (err) {
    console.error("POST /api/songs/bulk error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
