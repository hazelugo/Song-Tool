import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistSongs, songs } from "@/db/schema";
import { and, eq, notInArray, isNull } from "drizzle-orm";
import { getKeyCompatibility } from "@/lib/camelot";

const USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const BPM_RANGE = 15;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Verify ownership and load playlist songs
    const playlist = await db.query.playlists.findFirst({
      where: and(eq(playlists.id, id), eq(playlists.userId, USER_ID)),
      with: {
        songs: {
          with: { song: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const playlistSongList = playlist.songs.map((ps) => ps.song);

    if (playlistSongList.length === 0) {
      return NextResponse.json([]);
    }

    // Compute playlist stats
    const bpms = playlistSongList.map((s) => s.bpm).filter(Boolean) as number[];
    const avgBpm = bpms.reduce((a, b) => a + b, 0) / bpms.length;
    const existingIds = playlistSongList.map((s) => s.id);

    // Query catalog for candidate songs (not in playlist, not deleted, BPM in range)
    const candidates = await db
      .select()
      .from(songs)
      .where(
        and(
          isNull(songs.deletedAt),
          notInArray(songs.id, existingIds),
          // BPM range filter handled in JS to avoid complex SQL; candidate pool is bounded
        ),
      )
      .limit(200);

    // Score each candidate
    type Suggestion = {
      id: string;
      name: string;
      bpm: number | null;
      musicalKey: string;
      keySignature: string;
      score: number;
      reasons: string[];
    };

    const scored: Suggestion[] = [];

    for (const candidate of candidates) {
      const reasons: string[] = [];
      let score = 0;

      // BPM compatibility
      if (candidate.bpm !== null) {
        const bpmDiff = Math.abs(candidate.bpm - avgBpm);
        if (bpmDiff <= BPM_RANGE) {
          score += 1;
          reasons.push(`${candidate.bpm} BPM (±${Math.round(bpmDiff)} from avg)`);
        } else {
          // Skip songs too far out of BPM range
          continue;
        }
      }

      // Key compatibility — check against the most common key in playlist
      const keyCounts: Record<string, number> = {};
      for (const s of playlistSongList) {
        const k = `${s.musicalKey}-${s.keySignature}`;
        keyCounts[k] = (keyCounts[k] ?? 0) + 1;
      }
      const dominantKey = Object.entries(keyCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      if (dominantKey) {
        const [playlistKey, playlistSig] = dominantKey.split("-");
        const compat = getKeyCompatibility(
          playlistKey,
          playlistSig,
          candidate.musicalKey,
          candidate.keySignature,
        );
        if (compat.compatible) {
          score += compat.score;
          reasons.push(compat.reason);
        }
      }

      if (score > 0) {
        scored.push({
          id: candidate.id,
          name: candidate.name,
          bpm: candidate.bpm,
          musicalKey: candidate.musicalKey,
          keySignature: candidate.keySignature,
          score,
          reasons,
        });
      }
    }

    // Sort by score descending, return top 10
    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json(scored.slice(0, 10));
  } catch (err) {
    console.error(`GET /api/playlists/${id}/suggestions error:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
