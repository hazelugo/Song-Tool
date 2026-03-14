import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { songApiSchema } from "@/lib/validations/song";
import { requireUser } from "@/lib/auth";

function parseChordProgressions(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params; // Next.js 15: params is a Promise — must await
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

    await db.transaction(async (tx) => {
      await tx
        .update(songs)
        .set({ ...songData, chordProgressions })
        .where(and(eq(songs.id, id), eq(songs.userId, userId)));
      // Delete-all-reinsert: simpler than diffing for v1
      await tx.delete(tags).where(eq(tags.songId, id));
      const normalizedTags = [
        ...new Set(tagNames.map((t) => t.toLowerCase().trim())),
      ].filter(Boolean);
      if (normalizedTags.length > 0) {
        await tx
          .insert(tags)
          .values(normalizedTags.map((name) => ({ songId: id, name })));
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/songs/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params; // Next.js 15: params is a Promise — must await
    // Soft delete only — playlist_songs.song_id has no cascade
    await db
      .update(songs)
      .set({ deletedAt: new Date() })
      .where(and(eq(songs.id, id), eq(songs.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/songs/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete song" },
      { status: 500 },
    );
  }
}
