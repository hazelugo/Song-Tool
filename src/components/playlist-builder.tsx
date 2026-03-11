"use client";

import React, { useState, useRef, useEffect } from "react";
import { generateRank, rebalanceRanks } from "@/lib/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GripVertical, X, Plus } from "lucide-react";

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface PlaylistItem {
  id: string;
  song: Song;
  rank: number;
}

export interface PlaylistBuilderProps {
  availableSongs: Song[];
  onSave: (name: string, items: PlaylistItem[]) => Promise<void>;
  initialName?: string;
  initialItems?: PlaylistItem[];
}

export function PlaylistBuilder({
  availableSongs,
  onSave,
  initialName = "My New Playlist",
  initialItems = [],
}: PlaylistBuilderProps) {
  const [name, setName] = useState(initialName);
  const [items, setItems] = useState<PlaylistItem[]>(initialItems);
  const [isDragging, setIsDragging] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (initialItems) setItems(initialItems);
  }, [initialItems]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    const fromIndex = dragItem.current;
    const toIndex = dragOverItem.current;

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      const newItems = [...items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      // Calculate new rank
      const prevRank = newItems[toIndex - 1]?.rank;
      const nextRank = newItems[toIndex + 1]?.rank;

      try {
        movedItem.rank = generateRank(prevRank, nextRank);
        setItems(newItems);
      } catch (error) {
        // Rebalance if precision limit reached
        setItems(rebalanceRanks(newItems));
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
  };

  const addItem = (song: Song) => {
    const lastRank = items[items.length - 1]?.rank;
    const newItem: PlaylistItem = {
      id: crypto.randomUUID(),
      song,
      rank: generateRank(lastRank, undefined),
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.32))] gap-6 p-6">
      {/* Left: Library */}
      <div className="w-1/3 border rounded-lg flex flex-col bg-background">
        <div className="p-4 border-b font-semibold bg-muted/10">Library</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {availableSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="overflow-hidden">
                <div className="font-medium truncate">{song.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {song.artist}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => addItem(song)}
                className="opacity-0 group-hover:opacity-100"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Playlist */}
      <div className="flex-1 border rounded-lg flex flex-col bg-background">
        <div className="p-4 border-b flex items-center justify-between gap-4 bg-muted/10">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
          <Button onClick={() => onSave(name, items)}>Save Playlist</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-10">
                <p>Playlist is empty</p>
                <p className="text-sm">Drag songs here or click + to add</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border bg-card cursor-move transition-all hover:border-primary/50",
                    isDragging &&
                      dragItem.current === index &&
                      "opacity-50 ring-2 ring-primary ring-offset-2",
                  )}
                >
                  <GripVertical className="text-muted-foreground h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.song.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.song.artist} • {item.song.duration}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="p-2 border-t text-xs text-center text-muted-foreground bg-muted/5">
          {items.length} songs
        </div>
      </div>
    </div>
  );
}
