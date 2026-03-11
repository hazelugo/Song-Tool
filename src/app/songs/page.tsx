"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SongTable } from "@/components/songs/song-table";
import { SongSheet } from "@/components/songs/song-sheet";
import type { SongWithTags } from "@/db/schema";
import { SongFilters } from "@/components/songs/song-filters";

export const dynamic = "force-dynamic";

function SongsPageContent() {
  const [songs, setSongs] = useState<SongWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithTags | undefined>(
    undefined,
  );
  const searchParams = useSearchParams();

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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Songs</h1>
        <Button onClick={openAddSheet}>Add Song</Button>
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
