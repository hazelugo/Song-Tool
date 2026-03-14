import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";

const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

async function verifyPlaylistOwner(id: string) {
  return db.query.playlists.findFirst({
    where: and(eq(playlists.id, id), eq(playlists.userId, USER_ID)),
  });
}

// POST /api/playlists/[id]/songs — add songs to playlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const schema = z.object({ songIds: z.array(z.string().uuid()).min(1) });
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const playlist = await verifyPlaylistOwner(id);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    // Find current max position to append at end
    const [{ maxPos }] = await db
      .select({ maxPos: max(playlistSongs.position) })
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, id));

    let pos = (maxPos ?? 0) + 1;

    await db.transaction(async (tx) => {
      await tx
        .insert(playlistSongs)
        .values(
          result.data.songIds.map((songId, i) => ({
            playlistId: id,
            songId,
            position: pos + i,
          })),
        )
        .onConflictDoNothing();
      await tx
        .update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, id));
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/playlists/[id]/songs error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/playlists/[id]/songs — reorder songs
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const schema = z.object({ songIds: z.array(z.string().uuid()).min(1) });
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const playlist = await verifyPlaylistOwner(id);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await db.transaction(async (tx) => {
      // Delete and bulk-reinsert: 2 queries instead of N
      await tx
        .delete(playlistSongs)
        .where(eq(playlistSongs.playlistId, id));
      await tx.insert(playlistSongs).values(
        result.data.songIds.map((songId, i) => ({
          playlistId: id,
          songId,
          position: i + 1,
        })),
      );
      await tx
        .update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, id));
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/playlists/[id]/songs error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
