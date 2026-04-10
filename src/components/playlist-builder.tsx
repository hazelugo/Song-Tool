"use client";

import React, { useState, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { generateRank, rebalanceRanks } from "@/lib/ranking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GripVertical, X, Plus, ChevronLeft, Trash2 } from "lucide-react";
import type { Song } from "@/db/schema";

export interface PlaylistItem {
  id: string;
  song: Song;
  rank: number;
}

export interface PlaylistBuilderProps {
  availableSongs: Song[];
  onSave: (name: string, items: PlaylistItem[]) => Promise<void>;
  onDelete?: () => void;
  initialName?: string;
  initialItems?: PlaylistItem[];
  onClose: () => void;
}

function SortablePlaylistItem({
  item,
  onRemove,
}: {
  item: PlaylistItem;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border bg-card transition-all hover:border-primary/50",
        isDragging ? "opacity-30" : "",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{item.song.name}</div>
        <div className="text-xs text-muted-foreground">
          {item.song.bpm} BPM • {item.song.musicalKey}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(item.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlaylistBuilder({
  availableSongs,
  onSave,
  initialName = "My New Playlist",
  initialItems = [],
  onClose,
  onDelete,
}: PlaylistBuilderProps) {
  const [name, setName] = useState(initialName);
  const [items, setItems] = useState<PlaylistItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      const movedItem = { ...newItems[newIndex] };

      // Calculate new rank based on new neighbours
      const prevRank = newItems[newIndex - 1]?.rank;
      const nextRank = newItems[newIndex + 1]?.rank;

      try {
        movedItem.rank = generateRank(prevRank, nextRank);
        newItems[newIndex] = movedItem;
        setItems(newItems);
      } catch (error) {
        setItems(rebalanceRanks(newItems));
      }
    }
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

  // Build a Set of song IDs already in the playlist to exclude from library
  const itemSongIds = useMemo(
    () => new Set(items.map((item) => item.song.id)),
    [items],
  );

  const filteredSongs = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return availableSongs.filter(
      (song) =>
        !itemSongIds.has(song.id) &&
        (song.name.toLowerCase().includes(term) ||
          song.musicalKey.toLowerCase().includes(term) ||
          song.bpm.toString().includes(term)),
    );
  }, [availableSongs, searchQuery, itemSongIds]);

  const libraryScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSongs.length,
    getScrollElement: () => libraryScrollRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Build your playlist</h1>
      </div>
      <div className="flex h-[calc(100vh-theme(spacing.32))] gap-6 p-6">
        {/* Left: Library */}
        <div className="w-1/3 border rounded-lg flex flex-col bg-background">
          <div className="p-4 border-b bg-muted/10 space-y-3">
            <div className="font-semibold">Library</div>
            <Input
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div ref={libraryScrollRef} className="flex-1 overflow-y-auto p-2">
            <div
              style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const song = filteredSongs[virtualItem.index];
                return (
                  <div
                    key={song.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: "8px",
                    }}
                  >
                    <div className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group h-full">
                      <div className="overflow-hidden">
                        <div className="font-medium truncate">{song.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {song.bpm} BPM • {song.musicalKey}
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
                  </div>
                );
              })}
            </div>
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
            <div className="flex items-center gap-2">
              {onDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button onClick={async () => { await onSave(name, items); }}>Save Playlist</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-10">
                  <p>Playlist is empty</p>
                  <p className="text-sm">Drag songs here or click + to add</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setActiveId(null)}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <SortablePlaylistItem
                        key={item.id}
                        item={item}
                        onRemove={removeItem}
                      />
                    ))}
                  </SortableContext>

                  <DragOverlay dropAnimation={null}>
                    {activeItem ? (
                      <div className="flex items-center gap-3 p-3 rounded-md border bg-card shadow-lg">
                        <div className="cursor-grabbing text-muted-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activeItem.song.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {activeItem.song.bpm} BPM • {activeItem.song.musicalKey}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
          <div className="p-2 border-t text-xs text-center text-muted-foreground bg-muted/5">
            {items.length} songs
          </div>
        </div>
      </div>
    </div>
  );
}
