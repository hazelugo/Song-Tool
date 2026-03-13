import { Hono } from "hono";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/db";
import { playlists, playlistSongs, songs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

// 1. Define the Context Variables type so TypeScript knows 'user' exists
type Variables = {
  user: {
    id: string;
    email?: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

// Define Zod Schema for validation
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

// 2. Auth Middleware
app.use("*", async (c, next) => {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("user", user);
  await next();
});

// 3. Secured Route
app.get("/", async (c) => {
  const user = c.var.user;
  const { id } = c.req.query();

  try {
    // Case A: Get specific playlist details (for loading into builder)
    if (id) {
      const [playlist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, user.id)))
        .limit(1);

      if (!playlist) {
        return c.json({ message: "Playlist not found" }, 404);
      }

      // Join playlist_songs -> songs to get metadata
      const items = await db
        .select({
          rank: playlistSongs.position,
          song: songs,
        })
        .from(playlistSongs)
        .innerJoin(songs, eq(playlistSongs.songId, songs.id))
        .where(eq(playlistSongs.playlistId, id))
        .orderBy(playlistSongs.position);

      return c.json({
        ...playlist,
        items: items.map((i) => ({
          id: crypto.randomUUID(), // Generate transient ID for the builder's sortable list
          rank: i.rank,
          song: {
            id: i.song.id,
            title: i.song.name, // Mapping schema 'name' to frontend 'title'
            artist: "Unknown", // Schema missing artist field currently
            duration: "0:00", // Schema missing duration field currently
          },
        })),
      });
    }

    // Case B: List all playlists
    const list = await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, user.id))
      .orderBy(desc(playlists.updatedAt));

    return c.json(list);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

app.post("/", async (c) => {
  try {
    const user = c.var.user; // Access the authenticated user
    const body = await c.req.json();

    // Validate request body
    const result = createPlaylistSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { message: "Invalid request", errors: result.error.flatten() },
        400,
      );
    }

    const { name, items } = result.data;

    await db.transaction(async (tx) => {
      const playlistId = randomUUID();

      await tx.insert(playlists).values({
        id: playlistId,
        userId: user.id, // Use the real user ID from auth
        name: name,
      });

      if (items.length > 0) {
        await tx.insert(playlistSongs).values(
          items.map((item: any, index: number) => ({
            playlistId: playlistId,
            songId: item.song.id,
            position: item.rank, // Use fractional index from frontend to prevent drift
          })),
        );
      }
    });

    return c.json({ message: "Playlist saved successfully" }, 201);
  } catch (error: any) {
    console.error("Error saving playlist:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

app.delete("/", async (c) => {
  const user = c.var.user;
  const { id } = c.req.query();

  if (!id) {
    return c.json({ message: "Playlist ID is required" }, 400);
  }

  try {
    const deleted = await db
      .delete(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return c.json({ message: "Playlist not found or unauthorized" }, 404);
    }

    return c.json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
