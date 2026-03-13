import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { updatePlaylistSchema } from "@/lib/validations/playlist";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await db.query.playlists.findFirst({
      where: eq(playlists.id, id),
      with: {
        songs: {
          orderBy: [asc(playlistSongs.position)],
          with: {
            song: {
              with: { tags: true },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/playlists/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePlaylistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422 },
      );
    }

    await db.update(playlists).set(parsed.data).where(eq(playlists.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/playlists/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Hard delete playlist — cascade will handle playlistSongs
    await db.delete(playlists).where(eq(playlists.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/playlists/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 },
    );
  }
}
