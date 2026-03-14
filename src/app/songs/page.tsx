"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SongTable } from "@/components/songs/song-table";
import { SongSheet } from "@/components/songs/song-sheet";
import type { SongWithTags } from "@/db/schema";
import { SongFilters } from "@/components/songs/song-filters";
import { CsvImportDialog } from "@/components/songs/csv-import-dialog";
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
  const [pageIndex, setPageIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;
  const prevFiltersRef = useRef(searchParams.toString());

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

  // Reset to page 0 when filters change
  useEffect(() => {
    const filtersStr = searchParams.toString();
    if (filtersStr !== prevFiltersRef.current) {
      prevFiltersRef.current = filtersStr;
      setPageIndex(0);
    }
  }, [searchParams]);

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(pageIndex + 1));
      const res = await fetch(`/api/songs?${params.toString()}`);
      if (res.ok) {
        const { data, total } = await res.json();
        setSongs(data);
        setTotal(total);
      }
    } catch {
      // Silent fail — table stays empty
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, pageIndex]);

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
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
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
          <CsvImportDialog onSuccess={loadSongs} />
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
          pageCount={Math.ceil(total / PAGE_SIZE)}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
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
