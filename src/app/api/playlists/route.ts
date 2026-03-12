import { db } from "@/db";
import { playlists, playlistSongs, songs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createPlaylistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  items: z.array(
    z.object({
      song: z.object({
        id: z.string(),
      }),
      rank: z.number(),
    }),
  ),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, id))
      .limit(1);

    if (!playlist) {
      return Response.json({ message: "Playlist not found" }, { status: 404 });
    }

    const items = await db
      .select({
        rank: playlistSongs.position,
        song: songs,
      })
      .from(playlistSongs)
      .innerJoin(songs, eq(playlistSongs.songId, songs.id))
      .where(eq(playlistSongs.playlistId, id))
      .orderBy(playlistSongs.position);

    return Response.json({
      ...playlist,
      items: items.map((i) => ({
        id: crypto.randomUUID(),
        rank: i.rank,
        song: i.song,
      })),
    });
  }

  const allPlaylists = await db
    .select()
    .from(playlists)
    .where(eq(playlists.userId, "00000000-0000-0000-0000-000000000000"))
    .orderBy(desc(playlists.updatedAt));

  return Response.json(allPlaylists);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createPlaylistSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: "Invalid request", errors: result.error.flatten() },
        { status: 400 },
      );
    }

    const { name, items, id } = result.data;
    const userId = "00000000-0000-0000-0000-000000000000";

    let playlistId = id;

    if (playlistId) {
      // Update existing
      await db
        .update(playlists)
        .set({ name })
        .where(eq(playlists.id, playlistId));

      // Replace items
      await db
        .delete(playlistSongs)
        .where(eq(playlistSongs.playlistId, playlistId));
    } else {
      // Create new
      const [newPlaylist] = await db
        .insert(playlists)
        .values({
          name,
          userId,
        })
        .returning({ id: playlists.id });
      playlistId = newPlaylist.id;
    }

    if (items.length > 0 && playlistId) {
      await db.insert(playlistSongs).values(
        items.map((item) => ({
          playlistId: playlistId!,
          songId: item.song.id,
          position: item.rank,
        })),
      );
    }

    return Response.json({ id: playlistId, message: "Playlist saved" });
  } catch (error) {
    console.error("Error saving playlist:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ message: "Playlist ID required" }, { status: 400 });
  }

  await db.delete(playlists).where(eq(playlists.id, id));
  return Response.json({ message: "Playlist deleted" });
}
