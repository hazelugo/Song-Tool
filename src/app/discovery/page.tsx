"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import type { SortingState } from "@tanstack/react-table";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SongTable } from "@/components/songs/song-table";
import { SongSheet } from "@/components/songs/song-sheet";
import type { SongWithTags } from "@/db/schema";
import { SongFilters } from "@/components/songs/song-filters";
import {
  PlaylistBuilder,
  type PlaylistItem,
} from "@/components/playlist-builder";

export const dynamic = "force-dynamic";

function DiscoveryPageContent() {
  const [songs, setSongs] = useState<SongWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithTags | undefined>(
    undefined,
  );
  const searchParams = useSearchParams();
  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);
  const router = useRouter();
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
        body: JSON.stringify({ name, items }),
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
      // Silent fail
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discovery</h1>
        <Button
          onClick={() => setShowPlaylistBuilder(true)}
          disabled={songs.length === 0}
        >
          Save results as Playlist
        </Button>
      </div>

      <SongFilters />

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

      <SongSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        song={selectedSong}
        onSuccess={loadSongs}
      />
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoveryPageContent />
    </Suspense>
  );
}
