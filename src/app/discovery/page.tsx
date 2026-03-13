"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SongTable } from "@/components/songs/song-table";
import type { SongWithTags } from "@/db/schema";
import { SongSheet } from "@/components/songs/song-sheet";
import {
  PlaylistBuilder,
  type PlaylistItem,
} from "@/components/playlist-builder";

export default function DiscoveryPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<SongWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithTags | undefined>(
    undefined,
  );
  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);

  const handleSearch = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openEditSheet = (song: SongWithTags) => {
    setSelectedSong(song);
    setSheetOpen(true);
  };

  const handleSuccess = () => {
    // For simplicity, we'll just clear results. A better UX might re-fetch.
    setResults([]);
  };

  const handlePlaylistSave = async (name: string, items: PlaylistItem[]) => {
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, items }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save playlist");
      }

      router.push("/playlists");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save playlist");
    }
  };

  if (showPlaylistBuilder) {
    const initialItems: PlaylistItem[] = results.map((song, index) => ({
      id: crypto.randomUUID(),
      song,
      rank: (index + 1) * 10000,
    }));

    return (
      <PlaylistBuilder
        availableSongs={results}
        onSave={handlePlaylistSave}
        initialName={prompt ? `Search: ${prompt}` : "New Playlist"}
        initialItems={initialItems}
        onClose={() => setShowPlaylistBuilder(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discovery</h1>
      </div>

      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Upbeat songs for a workout' or 'Acoustic songs in the key of G'"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowPlaylistBuilder(true)}
          >
            Save results as Playlist
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results.length > 0 ? (
        <SongTable
          data={results}
          onRowClick={openEditSheet}
          isLoading={isLoading}
        />
      ) : (
        !isLoading && (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded border border-dashed">
            <p>
              No results. Try a new search to discover songs from your library.
            </p>
          </div>
        )
      )}

      <SongSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        song={selectedSong}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
