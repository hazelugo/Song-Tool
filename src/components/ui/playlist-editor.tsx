"use client";

import * as React from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getCamelotPosition, formatCamelot } from "@/lib/camelot";
import { generateRank } from "@/lib/ranking";

interface Song {
  id: string;
  name: string;
  artist: string | null;
  musicalKey: string | null;
  keySignature: string | null;
  timeSignature: string | null;
  bpm: number | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
}

interface PlaylistEditorProps {
  playlistId: string;
  initialSongs: {
    song: Song;
    position: number | null;
  }[];
}

interface EditorItem {
  id: string; // song id — used as dnd-kit identifier
  song: Song;
  position: number;
}

interface ItemRowProps {
  song: Song;
  index: number;
  onRemove?: (id: string) => void;
  isRemoving?: boolean;
  isDragOverlay?: boolean;
}

function ItemRow({ song, index, onRemove, isRemoving, isDragOverlay }: ItemRowProps) {
  const camelot = song.musicalKey && song.keySignature
    ? getCamelotPosition(song.musicalKey, song.keySignature)
    : null;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors bg-card",
        isDragOverlay && "rounded-sm shadow-md border opacity-95",
      )}
    >
      {/* Track number */}
      <span className="w-6 text-right text-xs text-muted-foreground/50 shrink-0 tabular-nums select-none">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{song.name}</div>
        {song.artist && (
          <span className="text-xs text-muted-foreground">{song.artist}</span>
        )}
        <div className="flex gap-2 items-center mt-0.5 flex-wrap">
          {camelot && (
            <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">
              {formatCamelot(camelot)}
            </span>
          )}
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">
            {song.musicalKey} {song.keySignature}
          </span>
          {song.timeSignature && (
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">
              {song.timeSignature}
            </span>
          )}
          {song.bpm && (
            <>
              <span className="text-muted-foreground/40 text-xs">•</span>
              <span className="text-xs text-muted-foreground">{song.bpm} BPM</span>
            </>
          )}
        </div>
      </div>

      {/* Streaming links */}
      <div className="flex items-center gap-1 shrink-0">
        {song.youtubeUrl && (
          <a
            href={song.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1"
            title="Open on YouTube"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        )}
        {song.spotifyUrl && (
          <a
            href={song.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-green-500 p-1"
            title="Open on Spotify"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </a>
        )}
      </div>

      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={() => onRemove(song.id)}
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface SortableItemProps {
  id: string;
  song: Song;
  index: number;
  onRemove: (id: string) => void;
  isRemoving: boolean;
  isActive: boolean;
}

function SortableItem({ id, song, index, onRemove, isRemoving, isActive }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center border-b last:border-0",
        isActive && "opacity-30 bg-muted/20",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-2 py-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <ItemRow
          song={song}
          index={index}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      </div>
    </div>
  );
}

function toEditorItems(initialSongs: PlaylistEditorProps["initialSongs"]): EditorItem[] {
  const items = initialSongs.map((item, i) => ({
    id: item.song.id,
    song: item.song,
    position: item.position ?? (i + 1) * 10000,
  }));
  // Sort by position so initial render matches server order
  return items.sort((a, b) => a.position - b.position);
}

export function PlaylistEditor({
  playlistId,
  initialSongs,
}: PlaylistEditorProps) {
  const [items, setItems] = React.useState<EditorItem[]>(() => toEditorItems(initialSongs));
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const router = useRouter();

  const dndId = React.useId();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // prevents accidental drag on button clicks
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    setItems(toEditorItems(initialSongs));
  }, [initialSongs]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      // Compute new fractional position for the moved item only
      let newItems: EditorItem[];
      try {
        const prevRank = reordered[newIndex - 1]?.position;
        const nextRank = reordered[newIndex + 1]?.position;
        const newPosition = generateRank(prevRank, nextRank);
        newItems = reordered.map((item, i) =>
          i === newIndex ? { ...item, position: newPosition } : item,
        );
      } catch {
        // Ranks too close — rebalance all to sequential
        newItems = reordered.map((item, i) => ({ ...item, position: (i + 1) * 10000 }));
      }

      setItems(newItems);

      try {
        await fetch(`/api/playlists/${playlistId}/songs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: newItems.map((item) => ({ songId: item.id, position: item.position })),
          }),
        });
        // No router.refresh() — state is already correct, avoid flicker
      } catch (error) {
        console.error("Failed to save order", error);
        setItems(items); // revert on failure
      }
    }
  }

  const handleRemove = async (songId: string) => {
    setRemovingIds((prev) => new Set(prev).add(songId));
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      setItems((prev) => prev.filter((item) => item.id !== songId));
      router.refresh(); // refresh after remove to update song count in header
    } catch (error) {
      console.error("Failed to remove song", error);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;
  const activeIndex = activeId ? items.findIndex((i) => i.id === activeId) : -1;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="border rounded-sm bg-card overflow-hidden">
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              song={item.song}
              index={index}
              onRemove={handleRemove}
              isRemoving={removingIds.has(item.id)}
              isActive={item.id === activeId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="border rounded-xl overflow-hidden w-full">
            <div className="flex items-center">
              <div className="px-2 py-3 text-muted-foreground/40 shrink-0">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <ItemRow song={activeItem.song} index={activeIndex} isDragOverlay />
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
