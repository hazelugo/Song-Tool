"use client";

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
import { MUSICAL_KEYS } from "@/lib/validations/song";

export function SongFilters() {
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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/20">
      {/* BPM Range */}
      <div className="space-y-2">
        <Label htmlFor="bpmMin">Min BPM</Label>
        <Input
          id="bpmMin"
          type="number"
          placeholder="0"
          defaultValue={searchParams.get("bpmMin") ?? ""}
          onChange={(e) => debouncedUpdate("bpmMin", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bpmMax">Max BPM</Label>
        <Input
          id="bpmMax"
          type="number"
          placeholder="500"
          defaultValue={searchParams.get("bpmMax") ?? ""}
          onChange={(e) => debouncedUpdate("bpmMax", e.target.value)}
        />
      </div>

      {/* Key & Signature */}
      <div className="space-y-2">
        <Label htmlFor="key">Key</Label>
        <Select
          value={searchParams.get("key") ?? "all"}
          onValueChange={(val) => updateFilter("key", val === "all" ? "" : val)}
        >
          <SelectTrigger id="key">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {MUSICAL_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="keySig">Key Sig</Label>
        <Select
          value={searchParams.get("keySig") ?? "all"}
          onValueChange={(val) =>
            updateFilter("keySig", val === "all" ? "" : val)
          }
        >
          <SelectTrigger id="keySig">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Filters */}
      <div className="space-y-2 col-span-2 md:col-span-2">
        <Label htmlFor="lyric">Lyric search</Label>
        <Input
          id="lyric"
          placeholder="Search lyrics..."
          defaultValue={searchParams.get("lyric") ?? ""}
          onChange={(e) => debouncedUpdate("lyric", e.target.value)}
        />
      </div>
      <div className="space-y-2 col-span-2 md:col-span-2">
        <Label htmlFor="tag">Tag</Label>
        <Input
          id="tag"
          placeholder="Filter by tag..."
          defaultValue={searchParams.get("tag") ?? ""}
          onChange={(e) => debouncedUpdate("tag", e.target.value)}
        />
      </div>
      <div className="space-y-2 col-span-2 md:col-span-2">
        <Label htmlFor="chord">Chord keyword</Label>
        <Input
          id="chord"
          placeholder="e.g. Em or G, D"
          defaultValue={searchParams.get("chord") ?? ""}
          onChange={(e) => debouncedUpdate("chord", e.target.value)}
        />
      </div>
    </div>
  );
}
