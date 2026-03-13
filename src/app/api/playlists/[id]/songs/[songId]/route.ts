import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

// DELETE /api/playlists/[id]/songs/[songId] — remove a song from a playlist
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; songId: string }> },
) {
  const { id, songId } = await params;

  // Verify ownership
  const playlist = await db.query.playlists.findFirst({
    where: and(eq(playlists.id, id), eq(playlists.userId, USER_ID)),
  });
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    await db
      .delete(playlistSongs)
      .where(
        and(eq(playlistSongs.playlistId, id), eq(playlistSongs.songId, songId)),
      );

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/playlists/[id]/songs/[songId] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
