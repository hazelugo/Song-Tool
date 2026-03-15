"use client";

import * as React from "react";
import { Check, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SongItem = {
  id: string;
  name: string;
  musicalKey: string;
  keySignature: string;
  timeSignature: string;
  bpm: number;
};

interface AddSongsDialogProps {
  playlistId: string;
  existingSongIds: string[];
}

export function AddSongsDialog({
  playlistId,
  existingSongIds,
}: AddSongsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [songs, setSongs] = React.useState<SongItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      // Fetch all songs to populate the list
      fetch("/api/songs?limit=1000")
        .then((res) => res.json())
        .then((data) => {
          setSongs(Array.isArray(data.data) ? data.data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [open]);

  const filteredSongs = songs.filter(
    (s) =>
      !existingSongIds.includes(s.id) &&
      s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSong = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSave = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: Array.from(selected) }),
      });

      if (!res.ok) throw new Error("Failed");

      setOpen(false);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Songs
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] flex flex-col h-[80vh] sm:h-[600px]">
        <DialogHeader>
          <DialogTitle>Add Songs to Playlist</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading songs...
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No matching songs found
            </div>
          ) : (
            <div className="divide-y">
              {filteredSongs.map((song) => {
                const isSelected = selected.has(song.id);
                return (
                  <div
                    key={song.id}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted",
                    )}
                    onClick={() => toggleSong(song.id)}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-medium truncate">{song.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {song.musicalKey} {song.keySignature} • {song.timeSignature} • {song.bpm} BPM
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter className="pt-2">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selected.size} selected
            </div>
            <Button
              onClick={handleSave}
              disabled={selected.size === 0 || saving}
            >
              {saving ? "Adding..." : "Add Selected"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
