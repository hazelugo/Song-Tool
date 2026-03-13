import { db } from "@/db";
import { playlists, playlistSongs, songs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Music } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;

  // Fetch playlist basic info
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, id))
    .limit(1);

  if (!playlist) {
    notFound();
  }

  // Fetch songs in the playlist
  // Ordered by position for correct display
  const items = await db
    .select({
      song: songs,
      position: playlistSongs.position,
    })
    .from(playlistSongs)
    .innerJoin(songs, eq(playlistSongs.songId, songs.id))
    .where(eq(playlistSongs.playlistId, id))
    .orderBy(asc(playlistSongs.position));

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link
              href="/playlists"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "flex items-center -ml-3 h-8 px-2",
              )}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Playlists
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{playlist.name}</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>Add Songs</Button>
        </div>
      </div>

      {/* Song List */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Music className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">This playlist is empty</p>
            <p className="text-sm mt-1 mb-4">
              Add songs from the Discovery page
            </p>
            <Link
              href="/discovery"
              className={buttonVariants({ variant: "outline" })}
            >
              Go to Discovery
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {items.map(({ song, position }) => (
              <div
                key={song.id}
                className="group flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{song.name}</div>
                  <div className="text-sm text-muted-foreground flex gap-2 items-center mt-0.5">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {song.musicalKey} {song.keySignature}
                    </span>
                    <span>•</span>
                    <span>{song.bpm} BPM</span>
                  </div>
                </div>

                {/* Debug info for Phase 4 development - helpful for verifying sorting */}
                <div className="text-xs font-mono text-muted-foreground/30 select-none">
                  {position?.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
