"use client";

import { useState, useRef, Suspense } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongCard } from "@/components/discovery/song-card";
import type { SongWithTags } from "@/db/schema";
import type { FilterParams } from "@/lib/validations/filter";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

type DiscoveryResult = {
  filters: FilterParams;
  interpretation: string;
  songs: SongWithTags[];
  total: number;
};

function FilterPills({ filters }: { filters: FilterParams }) {
  const pills: string[] = [];
  if (filters.bpmMin !== undefined && filters.bpmMax !== undefined)
    pills.push(`BPM ${filters.bpmMin}–${filters.bpmMax}`);
  else if (filters.bpmMin !== undefined) pills.push(`BPM ≥ ${filters.bpmMin}`);
  else if (filters.bpmMax !== undefined) pills.push(`BPM ≤ ${filters.bpmMax}`);
  if (filters.key) pills.push(filters.key);
  if (filters.keySig) pills.push(filters.keySig);
  if (filters.timeSig) pills.push(filters.timeSig);
  if (filters.chord) pills.push(`chord: ${filters.chord}`);
  if (filters.tag) pills.push(`tag: ${filters.tag}`);
  if (filters.artist) pills.push(`artist: ${filters.artist}`);
  if (filters.lyric) pills.push(`"${filters.lyric}"`);
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <span
          key={p}
          className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded-sm bg-muted/60 border border-border/40 text-muted-foreground"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function DiscoveryContent() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setResult(data);
    } catch {
      setError("Failed to connect — check your network and try again");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function clearResult() {
    setResult(null);
    setError(null);
    setPrompt("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">
            Discovery
          </h1>
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            <Sparkles className="size-3" />
            AI
          </span>
        </div>
        {result && (
          <button
            type="button"
            onClick={clearResult}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the songs you're looking for… e.g. upbeat minor key songs around 130 BPM, or slow ballads in G major"
            rows={3}
            autoFocus
            disabled={isLoading}
            className="w-full resize-none rounded-sm border border-border bg-card px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[color:var(--color-chart-4)] focus:border-[color:var(--color-chart-4)] transition-all placeholder:text-muted-foreground/40 disabled:opacity-60"
          />
          <p className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/40 font-mono pointer-events-none select-none">
            Enter ↵
          </p>
        </div>
        <Button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="self-start h-10 md:h-8 text-xs rounded-sm px-4"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1 rounded-none bg-current animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
              Searching…
            </span>
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive font-mono">{error}</p>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Interpretation + filter pills */}
          <div className="flex flex-col gap-2 border border-border/40 bg-muted/10 rounded-sm px-4 py-3">
            {result.interpretation && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.interpretation}
              </p>
            )}
            <FilterPills filters={result.filters} />
          </div>

          {/* Count */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
              {result.total === 0
                ? "No songs found"
                : `${result.total} song${result.total !== 1 ? "s" : ""} found`}
            </span>
          </div>

          {/* Song grid */}
          {result.songs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => {}}
                  onFindSimilar={(s) => router.push(`/chain?seedId=${s.id}`)}
                />
              ))}
            </div>
          )}

          {result.total > result.songs.length && (
            <p className="text-[11px] text-muted-foreground/60 font-mono text-center">
              Showing {result.songs.length} of {result.total} — refine your query to narrow results
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-20">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
            Describe what you want
          </p>
          <p className="text-sm text-muted-foreground/50 max-w-sm leading-relaxed">
            Use natural language — mood, tempo, key, genre, or any combination.
            AI will translate your description into filters against your catalog.
          </p>
        </div>
      )}
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
