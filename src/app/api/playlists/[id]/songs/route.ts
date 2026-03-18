import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

async function verifyPlaylistOwner(id: string, userId: string) {
  return db.query.playlists.findFirst({
    where: and(eq(playlists.id, id), eq(playlists.userId, userId)),
  });
}

// POST /api/playlists/[id]/songs — add songs to playlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const schema = z.object({ songIds: z.array(z.string().uuid()).min(1) });
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const playlist = await verifyPlaylistOwner(id, userId);
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

// PUT /api/playlists/[id]/songs — reorder songs using fractional positions
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const schema = z.object({
    items: z.array(
      z.object({ songId: z.string().uuid(), position: z.number() }),
    ).min(1),
  });
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const playlist = await verifyPlaylistOwner(id, userId);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await db.transaction(async (tx) => {
      // Bulk UPDATE positions using a VALUES list — single round-trip
      await tx.execute(sql`
        UPDATE playlist_songs AS ps
        SET position = v.position
        FROM (VALUES ${sql.join(
          result.data.items.map(
            (item) => sql`(${item.songId}::uuid, ${item.position}::real)`,
          ),
          sql`, `,
        )}) AS v(song_id, position)
        WHERE ps.playlist_id = ${id}::uuid
          AND ps.song_id = v.song_id
      `);
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
