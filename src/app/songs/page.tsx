"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import type { SortingState } from "@tanstack/react-table";
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
import { buildSimilarQuery } from "@/lib/similar-query";

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
  const [sorting, setSorting] = useState<SortingState>([]);
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
      if (sorting.length > 0) {
        params.set("sort", sorting[0].id);
        params.set("sortDir", sorting[0].desc ? "desc" : "asc");
      }
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
  }, [searchParams, pageIndex, sorting]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleSortingChange = (s: SortingState) => {
    setSorting(s);
    setPageIndex(0);
  };

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
    <div className="flex flex-col gap-4 p-6 max-w-6xl mx-auto w-full">
      {/* Header row — DAW toolbar style */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Songs</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowPlaylistBuilder(true)}
            disabled={songs.length === 0}
            className="h-7 text-xs rounded-sm"
          >
            Save as Playlist
          </Button>
          <CsvImportDialog onSuccess={loadSongs} />
          <Button variant="default" onClick={openAddSheet} size="sm" className="h-7 text-xs rounded-sm">
            Add Song
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SongFilters />

      {/* Empty state */}
      {!isLoading && songs.length === 0 && !["bpmMin","bpmMax","key","keySig","timeSig","chord","tag","lyric"].some((k) => searchParams.get(k)) ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">No songs yet</p>
          <Button onClick={openAddSheet} size="sm" className="rounded-sm">Add your first song</Button>
        </div>
      ) : !isLoading && songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">No songs match your filters</p>
          <Button
            size="sm"
            className="h-7 text-xs rounded-sm"
            onClick={() => router.replace("/songs")}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <SongTable
          data={songs}
          onRowClick={openEditSheet}
          isLoading={isLoading}
          pageCount={Math.ceil(total / PAGE_SIZE)}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      )}

      {/* Sheet — keyed on song ID inside SongSheet via SongForm key prop */}
      <SongSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        song={selectedSong}
        onSuccess={loadSongs}
        onFindSimilar={
          selectedSong
            ? () =>
                router.push(
                  `/discovery?q=${encodeURIComponent(buildSimilarQuery(selectedSong))}`,
                )
            : undefined
        }
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
