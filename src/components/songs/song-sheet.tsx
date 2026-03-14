"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { SongForm } from "./song-form";
import { DeleteConfirm } from "./delete-confirm";
import type { SongWithTags } from "@/db/schema";
import type { SongFormValues } from "@/lib/validations/song";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song?: SongWithTags; // undefined = add mode; SongWithTags = edit mode
  onSuccess: () => void; // called after successful save or delete — triggers list refresh
}

function toFormValues(song: SongWithTags): Partial<SongFormValues> {
  return {
    name: song.name,
    bpm: song.bpm,
    musicalKey: song.musicalKey,
    keySignature: song.keySignature,
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
}: SongSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!song;

  const handleSubmit = async (values: SongFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // API expects chordProgressions as string (which is what values has)
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
      onOpenChange(false);
      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Song" : "Add Song"}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-6 pt-6">
          {/* Key the form on song ID — forces full remount and reset between add/edit */}
          <SongForm
            key={song?.id ?? "new"}
            defaultValues={song ? toFormValues(song) : undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Delete + tools only shown in edit mode */}
          {isEditMode && (
            <div className="pt-4 border-t space-y-3">
              <Link
                href={`/metronome?bpm=${song.bpm}&timeSig=${encodeURIComponent(song.timeSignature)}`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <Timer className="mr-2 h-4 w-4" /> Open in Metronome
              </Link>
              <DeleteConfirm onConfirm={handleDelete} isDeleting={isDeleting} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
