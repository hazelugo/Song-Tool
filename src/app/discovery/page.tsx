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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  // Navigation prompt state
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navPromptName, setNavPromptName] = useState("");
  const [isNavSaving, setIsNavSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [connectorPaths, setConnectorPaths] = useState<string[]>([]);
  const router = useRouter();

  // Scroll to reveal new columns or when last column finishes loading.
  // Double-rAF: first frame commits the new DOM nodes, second frame fires
  // after layout so scrollWidth is fully updated before we read it.
  const lastColLoading = chain[chain.length - 1]?.isLoading ?? false;
  useEffect(() => {
    if (chain.length <= 1) return;
    let outer: number;
    let inner: number;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          left: scrollRef.current.scrollWidth,
          behavior: "smooth",
        });
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [chain.length, lastColLoading]);

  // Block browser close/refresh when there's an unsaved path
  const hasUnsavedPath = chain.length > 0 &&
    chain.filter((c) => c.selectedIdx !== null).length > 1;
  useEffect(() => {
    if (!hasUnsavedPath) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedPath]);

  // Intercept in-app link clicks (capture phase fires before Next.js router)
  useEffect(() => {
    if (!hasUnsavedPath) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("/discovery")) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setNavPromptName("");
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [hasUnsavedPath]);

  // Measure selected card positions and compute SVG connector paths
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!innerRef.current) return;
      const container = innerRef.current;
      const cr = container.getBoundingClientRect();
      const paths: string[] = [];

      for (let depth = 0; depth < chain.length - 1; depth++) {
        const fromIdx = chain[depth].selectedIdx;
        const toIdx = chain[depth + 1].selectedIdx;
        if (fromIdx === null || toIdx === null) continue;

        const fromEl = container.querySelector<HTMLElement>(
          `[data-depth="${depth}"][data-idx="${fromIdx}"]`,
        );
        const toEl = container.querySelector<HTMLElement>(
          `[data-depth="${depth + 1}"][data-idx="${toIdx}"]`,
        );
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();

        const x1 = fr.right - cr.left;
        const y1 = fr.top - cr.top + fr.height / 2;
        const x2 = tr.left - cr.left;
        const y2 = tr.top - cr.top + tr.height / 2;
        const cx = (x1 + x2) / 2;

        paths.push(`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
      }

      setConnectorPaths(paths);
    });
    return () => cancelAnimationFrame(frame);
  }, [chain]);

  // The active path: all songs where selectedIdx is set
  const activePath = chain
    .filter((col) => col.selectedIdx !== null)
    .map((col) => col.songs[col.selectedIdx!]);

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

      // Only exclude songs on the active path — not every suggestion that appeared.
      // Excluding all suggestions depletes the catalog by step 7.
      const activePathIds = truncated
        .filter((col) => col.selectedIdx !== null)
        .map((col) => col.songs[col.selectedIdx!].id);
      await loadSimilar(selectedSong.id, activePathIds, depth + 1);
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

  async function saveAndNavigate(e: React.FormEvent) {
    e.preventDefault();
    if (!navPromptName.trim() || !pendingHref) return;
    setIsNavSaving(true);
    try {
      const items = activePath.map((song, i) => ({
        song: { id: song.id },
        rank: (i + 1) * 1000,
      }));
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: navPromptName.trim(), items }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message ?? "Failed to save playlist");
        return;
      }
      toast.success(`"${navPromptName.trim()}" saved`);
      router.push(pendingHref);
    } catch {
      toast.error("Failed to save playlist");
    } finally {
      setIsNavSaving(false);
    }
  }

  const hasChain = chain.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Navigation prompt modal */}
      <Dialog
        open={!!pendingHref}
        onOpenChange={(open) => {
          if (!open) { setPendingHref(null); setNavPromptName(""); }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Unsaved path</DialogTitle>
            <DialogDescription>
              You have a {activePath.length}-song discovery path. Save it as a playlist before leaving?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAndNavigate} className="flex flex-col gap-2 pt-1">
            <input
              autoFocus
              type="text"
              value={navPromptName}
              onChange={(e) => setNavPromptName(e.target.value)}
              placeholder="Playlist name…"
              className="h-8 text-sm rounded-lg border border-border bg-background px-3 font-mono focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring w-full"
            />
            <Button
              type="submit"
              size="default"
              disabled={!navPromptName.trim() || isNavSaving}
              className="w-full"
            >
              {isNavSaving ? "Saving…" : "Save & Leave"}
            </Button>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => router.push(pendingHref!)}
              className="flex-1"
            >
              Leave without saving
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => { setPendingHref(null); setNavPromptName(""); }}
              className="flex-1"
            >
              Stay on page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div ref={innerRef} className="relative flex items-start gap-0 min-w-max min-h-full pt-2">
            {/* SVG connector lines between selected cards */}
            {connectorPaths.length > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: "visible" }}
              >
                {connectorPaths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="var(--color-chart-4)"
                    strokeWidth="1.5"
                    strokeOpacity="0.55"
                    strokeDasharray="none"
                  />
                ))}
              </svg>
            )}

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
                        <div key={song.id} data-depth={depth} data-idx={idx}>
                          <ChainCard
                            song={song}
                            isSelected={col.selectedIdx === idx}
                            isSeed={depth === 0}
                            onClick={() =>
                              depth === 0 ? undefined : selectSong(depth, idx)
                            }
                          />
                        </div>
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
        <div className="flex-none border-t border-border/60 bg-background/95 backdrop-blur-sm px-6 pt-4 pb-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 sm:justify-between">
            {/* Path breadcrumb */}
            <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 shrink-0">
                Path
              </span>
              {activePath.map((song, i) => (
                <Fragment key={song.id}>
                  {i > 0 && (
                    <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-sm font-medium whitespace-nowrap text-foreground/80">
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
                  className="h-9 text-sm rounded-sm border border-border bg-card px-3 font-mono focus:outline-none focus:ring-1 focus:ring-[color:var(--color-chart-4)] focus:border-[color:var(--color-chart-4)] w-52"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!playlistName.trim() || isSaving}
                  className="h-9 text-sm rounded-sm px-4"
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
                  <X className="size-4" />
                </button>
              </form>
            ) : (
              <Button
                size="default"
                onClick={() => setShowSaveForm(true)}
                className="h-9 text-sm rounded-sm shrink-0"
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
