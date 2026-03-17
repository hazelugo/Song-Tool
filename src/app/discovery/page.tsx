"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SongWithTags } from "@/db/schema";
import { SongSheet } from "@/components/songs/song-sheet";
import { SongCard } from "@/components/discovery/song-card";
import {
  PlaylistBuilder,
  type PlaylistItem,
} from "@/components/playlist-builder";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSimilarQuery } from "@/lib/similar-query";

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

  // Cycle placeholder text
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

  // Auto-search if ?q= param is present (e.g. navigating from /songs "Find similar")
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
      throw new Error(error.message || "Failed to save");
    }
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

  const isIdle = !hasSearched;
  const interpreted = parsedFilters ? buildInterpretedLabel(parsedFilters) : "";

  return (
    <div className="w-full">
      {/* Search section — centered when idle, compact when results shown */}
      <div
        className={`w-full transition-all duration-300 ${
          isIdle
            ? "flex flex-col items-center justify-center min-h-[calc(100vh-140px)]"
            : "mb-6"
        }`}
      >
        <div className={`w-full ${isIdle ? "max-w-2xl mx-auto" : "max-w-3xl"}`}>
          {isIdle && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <Sparkles className="size-7 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">Discovery</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Describe what you&apos;re looking for in plain language
              </p>
            </div>
          )}

          {!isIdle && (
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-primary" />
              <h1 className="text-lg font-semibold">Discovery</h1>
            </div>
          )}

          {/* Search bar */}
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none z-10" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDER_PROMPTS[placeholderIdx]}
                autoFocus={isIdle}
                className="w-full h-14 pl-12 pr-28 text-base rounded-2xl border border-border bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!query.trim() || isLoading}
                  className="rounded-xl h-10 px-5"
                >
                  {isLoading ? (
                    <span className="flex gap-0.5 items-center">
                      <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                      <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Suggestion chips */}
          <div className={`flex flex-wrap gap-2 mt-4 ${isIdle ? "justify-center" : ""}`}>
            {SUGGESTIONS.map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSuggestion(prompt)}
                className="text-sm px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {!isLoading && searchError && (
        <div className="text-center py-20">
          <p className="text-destructive text-lg mb-2">Search failed</p>
          <p className="text-sm text-muted-foreground">{searchError}</p>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && results !== null && (
        <div>
          {/* Status bar */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {interpreted && (
                <>
                  <span className="text-xs text-muted-foreground">Interpreted as:</span>
                  <Badge variant="secondary" className="text-xs">
                    {interpreted}
                  </Badge>
                </>
              )}
              <span className="text-sm text-muted-foreground">
                {results.length === 0
                  ? "No songs found"
                  : `${results.length} song${results.length !== 1 ? "s" : ""} found`}
              </span>
            </div>
            {results.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPlaylistBuilder(true)}
              >
                Save as Playlist
              </Button>
            )}
          </div>

          {/* Card grid */}
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-2">
                No songs matched your search
              </p>
              <p className="text-sm text-muted-foreground">
                Try different words, adjust the BPM, or use one of the suggestions above
              </p>
            </div>
          )}
        </div>
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
