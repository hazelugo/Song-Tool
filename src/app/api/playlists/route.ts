import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

// Hardcoded user ID for V1 (matching [id]/route.ts)
const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const createPlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name cannot be empty"),
  items: z.array(
    z.object({
      song: z.object({
        id: z.string(),
      }),
      rank: z.number(),
    }),
  ),
});

export async function GET() {
  try {
    const list = await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, USER_ID))
      .orderBy(desc(playlists.updatedAt));

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createPlaylistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: result.error.flatten() },
        { status: 400 },
      );
    }

    const { name, items } = result.data;

    const playlistId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(playlists).values({
        id: playlistId,
        userId: USER_ID,
        name: name,
      });

      if (items.length > 0) {
        await tx.insert(playlistSongs).values(
          items.map((item) => ({
            playlistId: playlistId,
            songId: item.song.id,
            position: item.rank,
          })),
        );
      }
    });

    return NextResponse.json(
      { message: "Playlist saved successfully", id: playlistId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
