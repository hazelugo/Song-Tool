import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// Hardcoded user ID for now
const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

export async function GET() {
  try {
    const allPlaylists = await db.query.playlists.findMany({
      where: and(
        eq(playlists.userId, USER_ID),
        isNull(playlists.deletedAt)
      ),
      orderBy: (playlists, { desc }) => [desc(playlists.createdAt)],
    });
    return NextResponse.json(allPlaylists);
  } catch (err) {
    console.error("GET /api/playlists error:", err);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    const newPlaylist = await db.transaction(async (tx) => {
      const [playlist] = await tx
        .insert(playlists)
        .values({ name: data.name, userId: USER_ID })
        .returning();

      if (data.songs && data.songs.length > 0) {
        await tx.insert(playlistSongs).values(
          data.songs.map((songId: string, index: number) => ({
            playlistId: playlist.id,
            songId: songId,
            position: (index + 1) * 10000, // Initial position
          }))
        );
      }
      return playlist;
    });

    return NextResponse.json(newPlaylist, { status: 201 });
  } catch (err) {
    console.error("POST /api/playlists error:", err);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
