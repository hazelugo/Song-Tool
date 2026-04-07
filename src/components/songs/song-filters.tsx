"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";

const ADVANCED_KEYS = ["keySig", "timeSig", "chord"] as const;

const FILTER_KEYS = ["bpmMin", "bpmMax", "key", "keySig", "timeSig", "chord", "tag", "lyric", "artist"] as const;

function SongFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Controlled state for BPM inputs — needed for real-time range validation
  const [localBpmMin, setLocalBpmMin] = useState(searchParams.get("bpmMin") ?? "");
  const [localBpmMax, setLocalBpmMax] = useState(searchParams.get("bpmMax") ?? "");
  // Incrementing this key forces uncontrolled text inputs to remount (used by clear)
  const [resetKey, setResetKey] = useState(0);
  // Auto-expand if any advanced filter is active
  const [showAdvanced, setShowAdvanced] = useState(
    () => ADVANCED_KEYS.some((k) => searchParams.get(k)),
  );

  const hasActiveAdvanced = ADVANCED_KEYS.some((k) => searchParams.get(k));

  const hasActiveFilters = FILTER_KEYS.some((k) => searchParams.get(k));

  const bpmMinNum = localBpmMin ? parseInt(localBpmMin, 10) : null;
  const bpmMaxNum = localBpmMax ? parseInt(localBpmMax, 10) : null;
  const bpmRangeError =
    bpmMinNum !== null &&
    bpmMaxNum !== null &&
    !isNaN(bpmMinNum) &&
    !isNaN(bpmMaxNum) &&
    bpmMinNum > bpmMaxNum;

  // Helper to update URL params — reads from window.location.search (not the React
  // snapshot) so concurrent debounced updates don't overwrite each other.
  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/songs?${params.toString()}`);
  };

  // Debounce text inputs; trim whitespace before committing to URL
  const debouncedUpdate = useDebouncedCallback((key: string, value: string) => {
    updateFilter(key, value.trim() || undefined);
  }, 300);

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    setLocalBpmMin("");
    setLocalBpmMax("");
    setResetKey((n) => n + 1);
    router.replace(`/songs?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* DAW toolbar: compact, flat, horizontal strip */}
      <div className="flex flex-col border border-border/60 rounded-sm bg-muted/10">
        {/* Primary filters */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 p-3">
          {/* BPM Range */}
          <div className="flex flex-col gap-1 min-w-[60px]">
            <Label
              htmlFor="bpmMin"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              BPM Min
            </Label>
            <Input
              id="bpmMin"
              type="number"
              inputMode="numeric"
              placeholder="0"
              min={1}
              max={500}
              value={localBpmMin}
              onChange={(e) => {
                const val = e.target.value;
                setLocalBpmMin(val);
                debouncedUpdate("bpmMin", val);
              }}
              aria-invalid={bpmRangeError || undefined}
              aria-describedby={bpmRangeError ? "bpm-range-error" : undefined}
              className={cn(
                "h-10 md:h-7 text-xs rounded-sm font-mono w-20 px-2",
                bpmRangeError && "border-destructive focus-visible:ring-destructive",
              )}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[60px]">
            <Label
              htmlFor="bpmMax"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              BPM Max
            </Label>
            <Input
              id="bpmMax"
              type="number"
              inputMode="numeric"
              placeholder="500"
              min={1}
              max={500}
              value={localBpmMax}
              onChange={(e) => {
                const val = e.target.value;
                setLocalBpmMax(val);
                debouncedUpdate("bpmMax", val);
              }}
              aria-invalid={bpmRangeError || undefined}
              aria-describedby={bpmRangeError ? "bpm-range-error" : undefined}
              className={cn(
                "h-10 md:h-7 text-xs rounded-sm font-mono w-20 px-2",
                bpmRangeError && "border-destructive focus-visible:ring-destructive",
              )}
            />
          </div>

          {/* Key */}
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="key"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Key
            </Label>
            <Select
              value={searchParams.get("key") ?? "all"}
              onValueChange={(val) =>
                updateFilter("key", val === "all" ? "" : (val ?? undefined))
              }
            >
              <SelectTrigger id="key" className="h-10 md:h-7 text-xs rounded-sm w-24 font-mono">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-sm">
                <SelectItem value="all" className="text-xs">All</SelectItem>
                {MUSICAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k} className="text-xs font-mono">
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <Label
              htmlFor="tag"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Tag
            </Label>
            <Input
              key={`tag-${resetKey}`}
              id="tag"
              placeholder="Filter tag..."
              defaultValue={searchParams.get("tag") ?? ""}
              onChange={(e) => debouncedUpdate("tag", e.target.value)}
              className="h-10 md:h-7 text-xs rounded-sm"
            />
          </div>

          {/* Artist */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <Label
              htmlFor="artist"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Artist
            </Label>
            <Input
              key={`artist-${resetKey}`}
              id="artist"
              placeholder="Filter artist..."
              defaultValue={searchParams.get("artist") ?? ""}
              onChange={(e) => debouncedUpdate("artist", e.target.value)}
              className="h-10 md:h-7 text-xs rounded-sm"
            />
          </div>

          {/* Title / Lyrics */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <Label
              htmlFor="lyric"
              className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
            >
              Title / Lyrics
            </Label>
            <Input
              key={`lyric-${resetKey}`}
              id="lyric"
              placeholder="Search..."
              defaultValue={searchParams.get("lyric") ?? ""}
              onChange={(e) => debouncedUpdate("lyric", e.target.value)}
              className="h-10 md:h-7 text-xs rounded-sm"
            />
          </div>

          {/* Clear button — only visible when filters are active */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 md:h-7 self-end text-xs rounded-sm px-2 text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 border-t border-border/40 text-[10px] uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronDown
            className={cn("size-3 transition-transform", showAdvanced && "rotate-180")}
          />
          More filters
          {hasActiveAdvanced && (
            <span className="ml-1 size-1.5 rounded-full bg-primary inline-block" />
          )}
        </button>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 p-3 border-t border-border/40">
            {/* Mode */}
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="keySig"
                className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
              >
                Mode
              </Label>
              <Select
                value={searchParams.get("keySig") ?? "all"}
                onValueChange={(val) =>
                  updateFilter("keySig", val === "all" ? "" : (val ?? undefined))
                }
              >
                <SelectTrigger id="keySig" className="h-10 md:h-7 text-xs rounded-sm w-24">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="major" className="text-xs">Major</SelectItem>
                  <SelectItem value="minor" className="text-xs">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Signature */}
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="timeSig"
                className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
              >
                Time Sig
              </Label>
              <Select
                value={searchParams.get("timeSig") ?? "all"}
                onValueChange={(val) =>
                  updateFilter("timeSig", val === "all" ? "" : (val ?? undefined))
                }
              >
                <SelectTrigger id="timeSig" className="h-10 md:h-7 text-xs rounded-sm w-20 font-mono">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  {TIME_SIGNATURES.map((ts) => (
                    <SelectItem key={ts} value={ts} className="text-xs font-mono">
                      {ts}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chord */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <Label
                htmlFor="chord"
                className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
              >
                Chord
              </Label>
              <Input
                key={`chord-${resetKey}`}
                id="chord"
                placeholder="Em, G, D..."
                defaultValue={searchParams.get("chord") ?? ""}
                onChange={(e) => debouncedUpdate("chord", e.target.value)}
                className="h-10 md:h-7 text-xs rounded-sm font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* BPM range error — below the strip to avoid layout shift inside */}
      {bpmRangeError && (
        <p
          id="bpm-range-error"
          role="alert"
          className="text-[11px] text-destructive px-1"
        >
          Min BPM must be ≤ Max BPM
        </p>
      )}
    </div>
  );
}

export function SongFilters() {
  return (
    <Suspense
      fallback={
        <div className="h-[58px] border border-border/60 rounded-sm bg-muted/10 animate-pulse" />
      }
    >
      <SongFiltersContent />
    </Suspense>
  );
}
