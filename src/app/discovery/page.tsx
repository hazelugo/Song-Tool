"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  Suspense,
} from "react";
import { Search, X, ChevronRight, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SongWithTags } from "@/db/schema";
import { ChainCard } from "@/components/discovery/chain-card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

type Column = {
  songs: SongWithTags[];
  selectedIdx: number | null;
  isLoading: boolean;
};

// ─── Animated column wrapper ────────────────────────────────────────────────

function SlideIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      {children}
    </div>
  );
}

// ─── Seed search autocomplete ────────────────────────────────────────────────

function SeedSearch({
  onSelect,
  disabled,
}: {
  onSelect: (song: SongWithTags) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SongWithTags[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/songs/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setIsOpen(true);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(song: SongWithTags) {
    setQuery(song.name);
    setIsOpen(false);
    setSuggestions([]);
    onSelect(song);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a song in your catalog to start a chain…"
          disabled={disabled}
          autoFocus
          className="w-full h-10 pl-9 pr-9 text-sm rounded-sm border border-border bg-card font-mono focus:outline-none focus:ring-1 focus:ring-[color:var(--color-chart-4)] focus:border-[color:var(--color-chart-4)] transition-all placeholder:text-muted-foreground/35 placeholder:font-sans disabled:opacity-50"
        />
        {(query || loading) && (
          <div className="absolute right-2.5 flex items-center gap-1">
            {loading ? (
              <span className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1 rounded-none bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-sm mt-0.5 overflow-hidden shadow-xl"
        >
          {suggestions.map((song, i) => (
            <button
              key={song.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(song)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors border-b border-border/30 last:border-0",
                i === activeIdx
                  ? "bg-muted/50 text-foreground"
                  : "hover:bg-muted/30 text-foreground",
              )}
            >
              <span className="text-sm font-medium truncate">{song.name}</span>
              <span className="text-xs font-mono text-muted-foreground ml-3 shrink-0 tabular-nums">
                {song.musicalKey} {song.keySignature} · {song.bpm} BPM
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && query.trim() && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-sm mt-0.5 px-3 py-3 shadow-xl"
        >
          <p className="text-xs text-muted-foreground font-mono">
            No songs found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Column skeleton ─────────────────────────────────────────────────────────

function ColumnSkeleton() {
  return (
    <div className="w-56 flex flex-col gap-2">
      {[72, 56, 80].map((h, i) => (
        <div
          key={i}
          className="rounded-sm bg-muted/25 animate-pulse"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

// ─── Main discovery content ──────────────────────────────────────────────────

function DiscoveryContent() {
  const [chain, setChain] = useState<Column[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll chain to the right when a new column is added
  useEffect(() => {
    if (chain.length > 1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [chain.length]);

  // The active path: all songs where selectedIdx is set
  const activePath = chain
    .filter((col) => col.selectedIdx !== null)
    .map((col) => col.songs[col.selectedIdx!]);

  // Collect all song IDs currently in the chain (to exclude from similarity)
  function getAllIds(cols: Column[]): string[] {
    return cols.flatMap((col) => col.songs.map((s) => s.id));
  }

  const loadSimilar = useCallback(
    async (songId: string, excludeIds: string[], depth: number) => {
      try {
        const res = await fetch(
          `/api/similar?songId=${encodeURIComponent(songId)}&exclude=${excludeIds.join(",")}`,
        );
        const json = await res.json();
        const results: SongWithTags[] = json.results ?? [];

        setChain((prev) => {
          const next = [...prev];
          if (next.length > depth) {
            next[depth] = {
              songs: results,
              selectedIdx: null,
              isLoading: false,
            };
          }
          return next;
        });
      } catch {
        setChain((prev) => {
          const next = [...prev];
          if (next.length > depth) {
            next[depth] = { songs: [], selectedIdx: null, isLoading: false };
          }
          return next;
        });
      }
    },
    [],
  );

  const startChain = useCallback(
    async (song: SongWithTags) => {
      const seed: Column = { songs: [song], selectedIdx: 0, isLoading: false };
      const loading: Column = { songs: [], selectedIdx: null, isLoading: true };
      setChain([seed, loading]);
      setShowSaveForm(false);
      setPlaylistName("");
      await loadSimilar(song.id, [song.id], 1);
    },
    [loadSimilar],
  );

  const selectSong = useCallback(
    async (depth: number, idx: number) => {
      const selectedSong = chain[depth].songs[idx];

      // Update selectedIdx at depth, truncate beyond it, add loading column
      const truncated = chain.slice(0, depth + 1).map((col, i) =>
        i === depth ? { ...col, selectedIdx: idx } : col,
      );
      const withLoading: Column[] = [
        ...truncated,
        { songs: [], selectedIdx: null, isLoading: true },
      ];
      setChain(withLoading);

      const excludeIds = getAllIds(truncated);
      await loadSimilar(selectedSong.id, excludeIds, depth + 1);
    },
    [chain, loadSimilar],
  );

  async function saveAsPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!playlistName.trim() || activePath.length < 2) return;
    setIsSaving(true);
    try {
      const items = activePath.map((song, i) => ({
        song: { id: song.id },
        rank: (i + 1) * 1000,
      }));
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playlistName.trim(), items }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message ?? "Failed to save playlist");
        return;
      }
      toast.success(`"${playlistName.trim()}" saved`, {
        description: `${activePath.length} song${activePath.length !== 1 ? "s" : ""} added to playlist`,
      });
      router.push("/playlists");
    } catch {
      toast.error("Failed to save playlist");
    } finally {
      setIsSaving(false);
    }
  }

  const hasChain = chain.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header + search */}
      <div className="flex-none flex flex-col gap-4 p-6 pb-4 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Discovery
            </h1>
            {hasChain && (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
                <GitBranch className="size-3" />
                chain
              </span>
            )}
          </div>
          {activePath.length > 1 && !showSaveForm && (
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {activePath.length} songs in path
            </span>
          )}
        </div>
        <SeedSearch onSelect={startChain} />

        {/* Ranking legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border border-border/40 bg-muted/10 rounded-sm px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 shrink-0">
            Ranked by
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="text-[color:var(--color-chart-4)] font-semibold">①</span>
            Camelot key compatibility
            <span className="text-muted-foreground/40">— same / relative / adjacent (±1)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="text-[color:var(--color-chart-3)] font-semibold">②</span>
            BPM proximity
            <span className="text-muted-foreground/40">— within ±10% or ±20%</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="text-muted-foreground/60 font-semibold">③</span>
            Shared tags
            <span className="text-muted-foreground/40">— genre, feel, language hard-filtered</span>
          </span>
        </div>
      </div>

      {/* Empty state */}
      {!hasChain && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 pb-24">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
            Search for a song to begin
          </p>
          <p className="text-sm text-muted-foreground/40 max-w-sm leading-relaxed">
            Select a song from your catalog. It will branch into similar songs,
            which branch further — follow the chain or save your path as a
            playlist.
          </p>
        </div>
      )}

      {/* Chain visualization */}
      {hasChain && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-4"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex items-start gap-0 min-w-max min-h-full pt-2">
            {chain.map((col, depth) => (
              <Fragment key={depth}>
                {/* Connector arrow between columns */}
                {depth > 0 && (
                  <div className="flex items-start pt-5 px-2 shrink-0">
                    <ChevronRight
                      className={cn(
                        "size-4 transition-colors duration-150",
                        chain[depth - 1].selectedIdx !== null
                          ? "text-[color:var(--color-chart-4)]/60"
                          : "text-border/40",
                      )}
                    />
                  </div>
                )}

                {/* Column */}
                <SlideIn key={`col-${depth}`} delay={depth === 0 ? 0 : 80}>
                  <div className="w-56 shrink-0 flex flex-col gap-2">
                    {/* Column label */}
                    <div className="h-5 flex items-center mb-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
                        {depth === 0 ? "Seed" : `Step ${depth}`}
                      </span>
                    </div>

                    {col.isLoading ? (
                      <ColumnSkeleton />
                    ) : col.songs.length === 0 ? (
                      <div className="h-20 flex items-center justify-center">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30">
                          No similar found
                        </p>
                      </div>
                    ) : (
                      col.songs.map((song, idx) => (
                        <ChainCard
                          key={song.id}
                          song={song}
                          isSelected={col.selectedIdx === idx}
                          isSeed={depth === 0}
                          onClick={() =>
                            depth === 0 ? undefined : selectSong(depth, idx)
                          }
                        />
                      ))
                    )}
                  </div>
                </SlideIn>
              </Fragment>
            ))}

            {/* Trailing spacer so last column isn't flush to edge */}
            <div className="w-6 shrink-0" />
          </div>
        </div>
      )}

      {/* Sticky bottom bar — active path + save */}
      {activePath.length > 1 && (
        <div className="flex-none border-t border-border/60 bg-background/95 backdrop-blur-sm px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-4 justify-between">
            {/* Path breadcrumb */}
            <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 shrink-0">
                Path
              </span>
              {activePath.map((song, i) => (
                <Fragment key={song.id}>
                  {i > 0 && (
                    <ChevronRight className="size-3 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-xs font-medium whitespace-nowrap text-foreground/80">
                    {song.name}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Save form / button */}
            {showSaveForm ? (
              <form
                onSubmit={saveAsPlaylist}
                className="flex items-center gap-2 shrink-0"
              >
                <input
                  autoFocus
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Playlist name…"
                  className="h-7 text-xs rounded-sm border border-border bg-card px-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-[color:var(--color-chart-4)] focus:border-[color:var(--color-chart-4)] w-44"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!playlistName.trim() || isSaving}
                  className="h-7 text-xs rounded-sm px-3"
                >
                  {isSaving ? "Saving…" : "Save"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveForm(false);
                    setPlaylistName("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </form>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowSaveForm(true)}
                className="h-7 text-xs rounded-sm shrink-0"
              >
                Save as Playlist
              </Button>
            )}
          </div>
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
