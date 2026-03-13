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
        isDragOverlay && "rounded-xl shadow-2xl border opacity-95",
      )}
    >
      {/* Track number */}
      <span className="w-6 text-right text-xs text-muted-foreground/50 shrink-0 tabular-nums select-none">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{song.name}</div>
        <div className="flex gap-2 items-center mt-0.5 flex-wrap">
          {camelot && (
            <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
              {formatCamelot(camelot)}
            </span>
          )}
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            {song.musicalKey} {song.keySignature}
          </span>
          {song.bpm && (
            <>
              <span className="text-muted-foreground/40 text-xs">•</span>
              <span className="text-xs text-muted-foreground">{song.bpm} BPM</span>
            </>
          )}
        </div>
      </div>

      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
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

export function PlaylistEditor({
  playlistId,
  initialSongs,
}: PlaylistEditorProps) {
  const [items, setItems] = React.useState(
    initialSongs.map((item) => ({ ...item.song, id: item.song.id })),
  );
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // prevents accidental drag on button clicks
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    setItems(initialSongs.map((item) => ({ ...item.song, id: item.song.id })));
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
      const newOrder = arrayMove(items, oldIndex, newIndex);

      setItems(newOrder);

      try {
        await fetch(`/api/playlists/${playlistId}/songs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songIds: newOrder.map((s) => s.id) }),
        });
        // No router.refresh() — state is already correct, avoid flicker
      } catch (error) {
        console.error("Failed to save order", error);
        // Revert on failure
        setItems(items);
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

  const activeSong = activeId ? items.find((i) => i.id === activeId) : null;
  const activeIndex = activeId ? items.findIndex((i) => i.id === activeId) : -1;

  return (
    <DndContext
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
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          {items.map((song, index) => (
            <SortableItem
              key={song.id}
              id={song.id}
              song={song}
              index={index}
              onRemove={handleRemove}
              isRemoving={removingIds.has(song.id)}
              isActive={song.id === activeId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeSong ? (
          <div className="border rounded-xl overflow-hidden w-full">
            <div className="flex items-center">
              <div className="px-2 py-3 text-muted-foreground/40 shrink-0">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <ItemRow song={activeSong} index={activeIndex} isDragOverlay />
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
