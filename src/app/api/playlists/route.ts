import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs } from "@/db/schema";
import { and, eq, isNull, desc, count } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth";

const PAGE_SIZE = 25;

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

export async function GET(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const offset = (page - 1) * limit;

  const where = and(eq(playlists.userId, userId), isNull(playlists.deletedAt));

  try {
    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(playlists)
        .where(where)
        .orderBy(desc(playlists.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(playlists).where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

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
        userId,
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
