"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  songSchema,
  type SongFormValues,
  type SongFormInput,
  MUSICAL_KEYS,
  TIME_SIGNATURES,
} from "@/lib/validations/song";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TagInput } from "./tag-input";
import Link from "next/link";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SongFormProps {
  defaultValues?: Partial<SongFormValues>;
  onSubmit: (values: SongFormValues) => Promise<void>;
  isSubmitting: boolean;
  metronomeHref?: string;
}

export function SongForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  metronomeHref,
}: SongFormProps) {
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [draftLyrics, setDraftLyrics] = useState("");

  const form = useForm<SongFormInput, unknown, SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      name: "",
      bpm: undefined,
      musicalKey: undefined,
      keySignature: undefined,
      timeSignature: undefined,
      chordProgressions: "",
      lyrics: "",
      youtubeUrl: "",
      spotifyUrl: "",
      tags: [],
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({ ...values, tags });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Song name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter song name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* BPM + Key */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bpm">BPM *</Label>
          <div className="flex gap-2">
            <Input
              id="bpm"
              type="number"
              min={1}
              max={500}
              {...form.register("bpm", { valueAsNumber: true })}
              placeholder="e.g. 120"
            />
            {metronomeHref && (
              <Link
                href={metronomeHref}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors shrink-0",
                )}
                title="Open in Metronome"
              >
                <Timer className="h-4 w-4" />
              </Link>
            )}
          </div>
          {form.formState.errors.bpm && (
            <p className="text-sm text-destructive">
              {form.formState.errors.bpm.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Key *</Label>
          <Select
            value={form.watch("musicalKey")}
            onValueChange={(v) =>
              form.setValue("musicalKey", v as SongFormValues["musicalKey"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {MUSICAL_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.musicalKey && (
            <p className="text-sm text-destructive">
              {form.formState.errors.musicalKey.message}
            </p>
          )}
        </div>
      </div>

      {/* Key Signature + Time Signature */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Key Sig *</Label>
          <Select
            value={form.watch("keySignature")}
            onValueChange={(v) =>
              form.setValue("keySignature", v as "major" | "minor", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.keySignature && (
            <p className="text-sm text-destructive">
              {form.formState.errors.keySignature.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Time Sig *</Label>
          <Select
            value={form.watch("timeSignature")}
            onValueChange={(v) =>
              form.setValue(
                "timeSignature",
                v as SongFormValues["timeSignature"],
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SIGNATURES.map((ts) => (
                <SelectItem key={ts} value={ts}>
                  {ts}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.timeSignature && (
            <p className="text-sm text-destructive">
              {form.formState.errors.timeSignature.message}
            </p>
          )}
        </div>
      </div>

      {/* Chord Progressions */}
      <div className="space-y-1.5">
        <Label htmlFor="chordProgressions">Chord Progressions</Label>
        <Textarea
          id="chordProgressions"
          {...form.register("chordProgressions")}
          placeholder="e.g. G, D, Em, C (comma or space separated)"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Enter chords separated by commas or spaces
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <TagInput id="tags" value={tags} onChange={setTags} />
        <p className="text-xs text-muted-foreground">
          Type a tag and press Enter
        </p>
      </div>

      {/* YouTube URL */}
      <div className="space-y-1.5">
        <Label htmlFor="youtubeUrl">YouTube URL</Label>
        <Input
          id="youtubeUrl"
          {...form.register("youtubeUrl")}
          placeholder="https://youtube.com/..."
        />
        {form.formState.errors.youtubeUrl && (
          <p className="text-sm text-destructive">
            {form.formState.errors.youtubeUrl.message}
          </p>
        )}
      </div>

      {/* Spotify URL */}
      <div className="space-y-1.5">
        <Label htmlFor="spotifyUrl">Spotify URL</Label>
        <Input
          id="spotifyUrl"
          {...form.register("spotifyUrl")}
          placeholder="https://open.spotify.com/..."
        />
        {form.formState.errors.spotifyUrl && (
          <p className="text-sm text-destructive">
            {form.formState.errors.spotifyUrl.message}
          </p>
        )}
      </div>

      {/* Lyrics */}
      <div className="space-y-1.5">
        {form.watch("lyrics") ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Lyrics</Label>
              <button
                type="button"
                onClick={() => {
                  setDraftLyrics(form.getValues("lyrics") ?? "");
                  setLyricsOpen(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                Edit lyrics
              </button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 font-mono whitespace-pre-wrap">
              {form.watch("lyrics")}
            </p>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraftLyrics("");
              setLyricsOpen(true);
            }}
            className="text-muted-foreground"
          >
            + Add lyrics
          </Button>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Song"}
      </Button>

      {/* Lyrics editor dialog */}
      <Dialog open={lyricsOpen} onOpenChange={setLyricsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Lyrics</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftLyrics}
            onChange={(e) => setDraftLyrics(e.target.value)}
            placeholder="Enter lyrics..."
            className="flex-1 resize-none rounded-none border-0 focus-visible:ring-0 font-mono text-sm leading-relaxed px-6 py-4"
          />
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="default"
              onClick={() => setLyricsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue("lyrics", draftLyrics, { shouldDirty: true });
                setLyricsOpen(false);
              }}
            >
              Save lyrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
