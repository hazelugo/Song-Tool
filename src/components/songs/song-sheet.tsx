"use client";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SongForm } from "./song-form";
import { DeleteConfirm } from "./delete-confirm";
import type { SongWithTags } from "@/db/schema";
import type { SongFormValues } from "@/lib/validations/song";

interface SongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song?: SongWithTags; // undefined = add mode; SongWithTags = edit mode
  onSuccess: () => void; // called after successful save or delete — triggers list refresh
  onFindSimilar?: () => void; // optional — shows "Find similar" button in edit mode
}

function toFormValues(song: SongWithTags): Partial<SongFormValues> {
  return {
    name: song.name,
    bpm: song.bpm,
    musicalKey: song.musicalKey,
    keySignature: song.keySignature,
    timeSignature: song.timeSignature,
    chordProgressions: Array.isArray(song.chordProgressions)
      ? song.chordProgressions.join(", ")
      : "",
    lyrics: song.lyrics ?? "",
    youtubeUrl: song.youtubeUrl ?? "",
    spotifyUrl: song.spotifyUrl ?? "",
    tags: song.tags.map((t) => t.name),
  };
}

export function SongSheet({
  open,
  onOpenChange,
  song,
  onSuccess,
  onFindSimilar,
}: SongSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const isEditMode = !!song;

  // Reset dirty state whenever the sheet opens fresh
  useEffect(() => {
    if (open) {
      setIsDirty(false);
      setShowDiscard(false);
    }
  }, [open]);

  // Intercept overlay/Escape closes — show confirmation if form has unsaved changes
  const handleSheetOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      setShowDiscard(true);
      return;
    }
    onOpenChange(next);
  };

  const handleDiscard = () => {
    setShowDiscard(false);
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleSubmit = async (values: SongFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { ...values };
      const url = isEditMode ? `/api/songs/${song.id}` : "/api/songs";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.error ? JSON.stringify(data.error) : "Failed to save song",
        );
        return;
      }

      setIsDirty(false);
      onOpenChange(false);
      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!song) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete song");
        return;
      }
      setIsDirty(false);
      onOpenChange(false);
      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Song" : "Add Song"}</SheetTitle>
            {isEditMode && onFindSimilar && (
              <button
                type="button"
                onClick={onFindSimilar}
                className="text-xs text-primary hover:underline text-left w-fit"
              >
                Find similar songs →
              </button>
            )}
          </SheetHeader>

          <div className="px-4 pb-4 space-y-6 pt-6">
            <SongForm
              key={song?.id ?? "new"}
              defaultValues={song ? toFormValues(song) : undefined}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onDirtyChange={setIsDirty}
              metronomeHref={
                isEditMode
                  ? `/metronome?bpm=${song.bpm}&timeSig=${encodeURIComponent(song.timeSignature)}`
                  : undefined
              }
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            {isEditMode && (
              <div className="pt-4 border-t">
                <DeleteConfirm onConfirm={handleDelete} isDeleting={isDeleting} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Unsaved-changes confirmation — shown when user tries to close with a dirty form */}
      <Dialog open={showDiscard} onOpenChange={(o) => { if (!o) setShowDiscard(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. If you close now, they&apos;ll be lost.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDiscard(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
