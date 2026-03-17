"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";

function SongFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to update URL params
  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/songs?${params.toString()}`);
  };

  // Debounce text inputs to avoid excessive API calls/URL updates
  const debouncedUpdate = useDebouncedCallback(updateFilter, 300);

  return (
    /* DAW toolbar: compact, flat, horizontal strip */
    <div className="flex flex-wrap gap-x-4 gap-y-3 p-3 border border-border/60 rounded-sm bg-muted/10">
      {/* BPM Range */}
      <div className="flex flex-col gap-1 min-w-[60px]">
        <Label htmlFor="bpmMin" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          BPM Min
        </Label>
        <Input
          id="bpmMin"
          type="number"
          placeholder="0"
          defaultValue={searchParams.get("bpmMin") ?? ""}
          onChange={(e) => debouncedUpdate("bpmMin", e.target.value)}
          className="h-7 text-xs rounded-sm font-mono w-20 px-2"
        />
      </div>
      <div className="flex flex-col gap-1 min-w-[60px]">
        <Label htmlFor="bpmMax" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          BPM Max
        </Label>
        <Input
          id="bpmMax"
          type="number"
          placeholder="500"
          defaultValue={searchParams.get("bpmMax") ?? ""}
          onChange={(e) => debouncedUpdate("bpmMax", e.target.value)}
          className="h-7 text-xs rounded-sm font-mono w-20 px-2"
        />
      </div>

      {/* Key & Signature */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="key" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Key
        </Label>
        <Select
          value={searchParams.get("key") ?? "all"}
          onValueChange={(val) =>
            updateFilter("key", val === "all" ? "" : (val ?? undefined))
          }
        >
          <SelectTrigger id="key" className="h-7 text-xs rounded-sm w-24 font-mono">
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
      <div className="flex flex-col gap-1">
        <Label htmlFor="keySig" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Mode
        </Label>
        <Select
          value={searchParams.get("keySig") ?? "all"}
          onValueChange={(val) =>
            updateFilter("keySig", val === "all" ? "" : (val ?? undefined))
          }
        >
          <SelectTrigger id="keySig" className="h-7 text-xs rounded-sm w-24">
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
        <Label htmlFor="timeSig" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Time Sig
        </Label>
        <Select
          value={searchParams.get("timeSig") ?? "all"}
          onValueChange={(val) =>
            updateFilter("timeSig", val === "all" ? "" : (val ?? undefined))
          }
        >
          <SelectTrigger id="timeSig" className="h-7 text-xs rounded-sm w-20 font-mono">
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

      {/* Text Filters */}
      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
        <Label htmlFor="chord" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Chord
        </Label>
        <Input
          id="chord"
          placeholder="Em, G, D..."
          defaultValue={searchParams.get("chord") ?? ""}
          onChange={(e) => debouncedUpdate("chord", e.target.value)}
          className="h-7 text-xs rounded-sm font-mono"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
        <Label htmlFor="tag" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Tag
        </Label>
        <Input
          id="tag"
          placeholder="Filter tag..."
          defaultValue={searchParams.get("tag") ?? ""}
          onChange={(e) => debouncedUpdate("tag", e.target.value)}
          className="h-7 text-xs rounded-sm"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
        <Label htmlFor="lyric" className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Title / Lyrics
        </Label>
        <Input
          id="lyric"
          placeholder="Search..."
          defaultValue={searchParams.get("lyric") ?? ""}
          onChange={(e) => debouncedUpdate("lyric", e.target.value)}
          className="h-7 text-xs rounded-sm"
        />
      </div>
    </div>
  );
}

export function SongFilters() {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <SongFiltersContent />
    </Suspense>
  );
}
