"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  name: string;
  bpm: number | null;
  musicalKey: string;
  keySignature: string;
  score: number;
  reasons: string[];
}

interface SuggestionsPanelProps {
  playlistId: string;
  existingSongIds: string[];
}

export function SuggestionsPanel({
  playlistId,
  existingSongIds,
}: SuggestionsPanelProps) {
  const [open, setOpen] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [addingIds, setAddingIds] = React.useState<Set<string>>(new Set());
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/suggestions`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && suggestions.length === 0) {
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return (
      <div className="border rounded-sm overflow-hidden">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        >
          <span className="text-sm font-semibold">Suggested Songs</span>
          <span className="text-xs text-muted-foreground">Show</span>
        </button>
      </div>
    );
  }

  const handleAdd = async (songId: string) => {
    setAddingIds((prev) => new Set(prev).add(songId));
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: [songId] }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setSuggestions((prev) => prev.filter((s) => s.id !== songId));
      router.refresh();
    } catch {
      // silent
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  // Filter out songs already in playlist
  const filtered = suggestions.filter((s) => !existingSongIds.includes(s.id));

  return (
    <div className="border rounded-sm bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-semibold">
          Suggested Songs
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Finding compatible songs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {suggestions.length === 0
              ? "No compatible songs found in your catalog."
              : "All suggestions are already in this playlist."}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded-sm">
                      {s.musicalKey} {s.keySignature}
                    </span>
                    {s.bpm && (
                      <span className="text-xs text-muted-foreground">
                        {s.bpm} BPM
                      </span>
                    )}
                    {s.reasons.map((r) => (
                      <span
                        key={r}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wide",
                          s.score >= 3
                            ? "bg-[color:var(--color-chart-4)]/15 text-[color:var(--color-chart-4)]"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAdd(s.id)}
                  disabled={addingIds.has(s.id)}
                  className="flex-shrink-0 rounded-sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
