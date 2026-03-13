"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SongTable } from "@/components/songs/song-table";
import { SongSheet } from "@/components/songs/song-sheet";
import type { SongWithTags } from "@/db/schema";
import { SongFilters } from "@/components/songs/song-filters";
import {
  PlaylistBuilder,
  PlaylistItem,
} from "@/components/playlist-builder";

export const dynamic = "force-dynamic";

function SongsPageContent() {
  const [songs, setSongs] = useState<SongWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithTags | undefined>(
    undefined,
  );
  const searchParams = useSearchParams();
  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);
  const router = useRouter();
  const playlistId = searchParams.get("id");

  async function savePlaylist(name: string, items: PlaylistItem[]) {
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, items, id: playlistId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }
      router.push("/playlists");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/songs?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch {
      // Silent fail — table stays empty
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const openAddSheet = () => {
    setSelectedSong(undefined);
    setSheetOpen(true);
  };

  const openEditSheet = (song: SongWithTags) => {
    setSelectedSong(song);
    setSheetOpen(true);
  };

  if (showPlaylistBuilder) {
    return (
      <PlaylistBuilder
        availableSongs={songs}
        onSave={savePlaylist}
        onClose={() => setShowPlaylistBuilder(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Songs</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowPlaylistBuilder(true)}
            disabled={songs.length === 0}
          >
            Save results as Playlist
          </Button>
          <Button onClick={openAddSheet}>Add Song</Button>
        </div>
      </div>

      {/* Filters */}
      <SongFilters />

      {/* Empty state */}
      {!isLoading && songs.length === 0 && searchParams.toString() === "" ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground">No songs yet</p>
          <Button onClick={openAddSheet}>Add your first song</Button>
        </div>
      ) : (
        <SongTable
          data={songs}
          onRowClick={openEditSheet}
          isLoading={isLoading}
        />
      )}

      {/* Sheet — keyed on song ID inside SongSheet via SongForm key prop */}
      <SongSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        song={selectedSong}
        onSuccess={loadSongs}
      />
    </div>
  );
}

export default function SongsPage() {
  return (
    <Suspense fallback={<div>Loading songs...</div>}>
      <SongsPageContent />
    </Suspense>
  );
}
