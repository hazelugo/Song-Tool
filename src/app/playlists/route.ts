import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { or, ilike, sql, exists, eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json([]);
    }

    const searchTerm = prompt.trim();
    if (!searchTerm) {
      return Response.json([]);
    }

    // Search by name (partial), lyrics (semantic/fts), or tags (exact/partial)
    const results = await db.query.songs.findMany({
      where: or(
        ilike(songs.name, `%${searchTerm}%`),
        sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${searchTerm})`,
        exists(
          db
            .select()
            .from(tags)
            .where(
              and(
                eq(tags.songId, songs.id),
                ilike(tags.name, `%${searchTerm}%`),
              ),
            ),
        ),
      ),
      with: {
        tags: true,
      },
      limit: 50,
    });

    return Response.json(results);
  } catch (error) {
    console.error("Search failed", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
