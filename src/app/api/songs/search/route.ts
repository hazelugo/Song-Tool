import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { and, isNull, eq, ilike, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) return NextResponse.json([]);

  try {
    const results = await db.query.songs.findMany({
      where: and(
        isNull(songs.deletedAt),
        eq(songs.userId, userId),
        ilike(songs.name, `%${q}%`),
      ),
      with: { tags: true },
      orderBy: asc(songs.name),
      limit: 8,
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/songs/search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
