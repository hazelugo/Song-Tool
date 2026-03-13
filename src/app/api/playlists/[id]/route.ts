import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

// Hardcoded user ID for now
const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const playlist = await db.query.playlists.findFirst({
      where: and(
        eq(playlists.id, id),
        eq(playlists.userId, USER_ID),
        isNull(playlists.deletedAt),
      ),
      with: {
        songs: {
          with: {
            song: true,
          },
          orderBy: (playlistSongs, { asc }) => [asc(playlistSongs.position)],
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(playlist);
  } catch (err) {
    console.error(`GET /api/playlists/${id} error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}

// PATCH /api/playlists/[id] — update playlist name
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const schema = z.object({ name: z.string().min(1) });
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(playlists)
      .set({ name: result.data.name })
      .where(and(eq(playlists.id, id), eq(playlists.userId, USER_ID)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/playlists/${id} error:`, err);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const [deleted] = await db
      .update(playlists)
      .set({ deletedAt: new Date() })
      .where(and(eq(playlists.id, id), eq(playlists.userId, USER_ID)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(`DELETE /api/playlists/${id} error:`, err);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 },
    );
  }
}
