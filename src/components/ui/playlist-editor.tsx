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

interface Song {
  id: string;
  name: string;
  musicalKey: string | null;
  keySignature: string | null;
  bpm: number | null;
}

interface PlaylistEditorProps {
  playlistId: string;
  initialSongs: {
    song: Song;
    position: number | null;
  }[];
}

interface SortableItemProps {
  id: string;
  song: Song;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

function SortableItem({ id, song, onRemove, isRemoving }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
        "group flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors bg-card border-b last:border-0",
        isDragging && "shadow-lg bg-muted/60",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-foreground text-muted-foreground/50 flex-shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{song.name}</div>
        <div className="text-sm text-muted-foreground flex gap-2 items-center mt-0.5">
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            {song.musicalKey} {song.keySignature}
          </span>
          <span>•</span>
          <span>{song.bpm} BPM</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
        onClick={() => onRemove(song.id)}
        disabled={isRemoving}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlaylistEditor({
  playlistId,
  initialSongs,
}: PlaylistEditorProps) {
  const [items, setItems] = React.useState(
    initialSongs.map((item) => ({ ...item.song, id: item.song.id })),
  );
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sync with props if they change (e.g. after adding songs)
  React.useEffect(() => {
    setItems(initialSongs.map((item) => ({ ...item.song, id: item.song.id })));
  }, [initialSongs]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      setItems(newOrder); // Optimistic update

      try {
        await fetch(`/api/playlists/${playlistId}/songs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songIds: newOrder.map((s) => s.id) }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to save order", error);
        // Could revert state here if needed
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
      router.refresh();
    } catch (error) {
      console.error("Failed to remove song", error);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y border rounded-xl bg-card shadow-sm overflow-hidden">
          {items.map((song) => (
            <SortableItem
              key={song.id}
              id={song.id}
              song={song}
              onRemove={handleRemove}
              isRemoving={removingIds.has(song.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
