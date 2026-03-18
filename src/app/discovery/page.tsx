"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SongWithTags } from "@/db/schema";
import { SongSheet } from "@/components/songs/song-sheet";
import { SongCard } from "@/components/discovery/song-card";
import {
  PlaylistBuilder,
  type PlaylistItem,
} from "@/components/playlist-builder";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSimilarQuery } from "@/lib/similar-query";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const SUGGESTIONS = [
  { label: "Upbeat & Energetic", prompt: "upbeat energetic dance 120 BPM" },
  { label: "Dark Minor Ballad", prompt: "dark slow ballad minor key" },
  { label: "Chill Mid-Tempo", prompt: "chill medium 90 BPM relaxed" },
  { label: "Fast & Intense", prompt: "fast energetic hype 140 BPM" },
  { label: "Slow & Peaceful", prompt: "peaceful acoustic slow calm" },
  { label: "Major Key", prompt: "upbeat major key" },
];

const PLACEHOLDER_PROMPTS = [
  "dark minor ballad around 80 BPM...",
  "upbeat dance tracks 120+ BPM...",
  "something in G major...",
  "chill acoustic slow songs...",
  "energetic with Em chord...",
  "medium tempo 3/4 time...",
];

type ParsedFilters = {
  key?: string;
  keySig?: "major" | "minor";
  timeSig?: string;
  bpmMin?: number;
  bpmMax?: number;
  searchTerm?: string;
};

function buildInterpretedLabel(filters: ParsedFilters): string {
  const parts: string[] = [];
  if (filters.key) parts.push(`${filters.key}`);
  if (filters.keySig)
    parts.push(filters.keySig === "major" ? "Major" : "Minor");
  if (filters.timeSig) parts.push(filters.timeSig);
  if (filters.bpmMin !== undefined && filters.bpmMax !== undefined) {
    parts.push(`${filters.bpmMin}–${filters.bpmMax} BPM`);
  } else if (filters.bpmMin !== undefined) {
    parts.push(`${filters.bpmMin}+ BPM`);
  } else if (filters.bpmMax !== undefined) {
    parts.push(`≤${filters.bpmMax} BPM`);
  }
  if (filters.searchTerm) parts.push(`"${filters.searchTerm}"`);
  return parts.join(" · ");
}

function DiscoveryContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongWithTags[] | null>(null);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongWithTags | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const search = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setResults(json.results);
        setParsedFilters(json.parsedFilters);
      } else {
        setResults(null);
        setSearchError(json.error ?? "Search failed");
      }
    } catch {
      setResults(null);
      setSearchError("Could not reach the server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const didAutoSearch = useRef(false);
  useEffect(() => {
    if (didAutoSearch.current) return;
    const q = searchParams.get("q");
    if (q) {
      didAutoSearch.current = true;
      setQuery(q);
      search(q);
    }
  }, [search, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const handleSuggestion = (prompt: string) => {
    setQuery(prompt);
    search(prompt);
  };

  const handleFindSimilar = useCallback(
    (song: SongWithTags) => {
      const q = buildSimilarQuery(song);
      setQuery(q);
      setSheetOpen(false);
      search(q);
    },
    [search],
  );

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setParsedFilters(null);
    setHasSearched(false);
    setSearchError(null);
    inputRef.current?.focus();
  };

  async function savePlaylist(name: string, items: PlaylistItem[]) {
    const response = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, items }),
    });
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.message || "Failed to save playlist");
      throw new Error(error.message || "Failed to save");
    }
    toast.success(`"${name}" saved`, {
      description: `${items.length} song${items.length !== 1 ? "s" : ""} added to playlist`,
    });
    router.push("/playlists");
  }

  const openSheet = (song: SongWithTags) => {
    setSelectedSong(song);
    setSheetOpen(true);
  };

  if (showPlaylistBuilder && results) {
    return (
      <PlaylistBuilder
        availableSongs={results}
        onSave={savePlaylist}
        onClose={() => setShowPlaylistBuilder(false)}
      />
    );
  }

  const interpreted = parsedFilters ? buildInterpretedLabel(parsedFilters) : "";

  return (
    <div className="flex flex-col gap-4 p-6 max-w-6xl mx-auto w-full">
      {/* Header row — DAW toolbar style */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Discovery
        </h1>
        {!isLoading && results !== null && results.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {interpreted && (
                <> · <span className="text-foreground">{interpreted}</span></>
              )}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPlaylistBuilder(true)}
              className="h-7 text-xs rounded-sm"
            >
              Save as Playlist
            </Button>
          </div>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER_PROMPTS[placeholderIdx]}
            autoFocus
            className="w-full h-10 pl-9 pr-28 text-sm rounded-sm border border-border bg-card font-mono focus:outline-none focus:ring-1 focus:ring-[color:var(--color-chart-4)] focus:border-[color:var(--color-chart-4)] transition-all placeholder:text-muted-foreground/40 placeholder:font-sans"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!query.trim() || isLoading}
              className="rounded-sm h-7 px-4 text-xs"
            >
              {isLoading ? (
                <span className="flex gap-0.5 items-center">
                  <span className="size-1 rounded-none bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="size-1 rounded-none bg-current animate-bounce [animation-delay:150ms]" />
                  <span className="size-1 rounded-none bg-current animate-bounce [animation-delay:300ms]" />
                </span>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(({ label, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleSuggestion(prompt)}
            className="text-xs px-2.5 py-1 rounded-sm border border-border/60 bg-muted/30 hover:bg-muted hover:border-[color:var(--color-chart-4)]/50 text-muted-foreground hover:text-foreground transition-all uppercase tracking-wide font-medium"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {!isLoading && searchError && (
        <div className="py-12 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-destructive mb-1">
            Search failed
          </p>
          <p className="text-sm text-muted-foreground">{searchError}</p>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-sm bg-muted/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && results !== null && (
        results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onClick={openSheet}
                onFindSimilar={handleFindSimilar}
              />
            ))}
          </div>
        ) : (
          hasSearched && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                No songs matched your search
              </p>
              <p className="text-xs text-muted-foreground">
                Try different words, adjust the BPM, or use one of the suggestions above
              </p>
            </div>
          )
        )
      )}

      <SongSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        song={selectedSong}
        onSuccess={() => query && search(query)}
        onFindSimilar={selectedSong ? () => handleFindSimilar(selectedSong) : undefined}
      />
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense>
      <DiscoveryContent />
    </Suspense>
  );
}
