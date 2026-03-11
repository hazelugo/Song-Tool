"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  songSchema,
  type SongFormValues,
  type SongFormInput,
  MUSICAL_KEYS,
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
import { TagInput } from "./tag-input";

interface SongFormProps {
  defaultValues?: Partial<SongFormValues>;
  onSubmit: (values: SongFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function SongForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: SongFormProps) {
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [showLyrics, setShowLyrics] = useState(!!defaultValues?.lyrics);

  const form = useForm<SongFormInput, unknown, SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      name: "",
      bpm: undefined,
      musicalKey: undefined,
      keySignature: undefined,
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

      {/* BPM */}
      <div className="space-y-1.5">
        <Label htmlFor="bpm">BPM *</Label>
        <Input
          id="bpm"
          type="number"
          min={1}
          max={500}
          {...form.register("bpm", { valueAsNumber: true })}
          placeholder="e.g. 120"
        />
        {form.formState.errors.bpm && (
          <p className="text-sm text-destructive">
            {form.formState.errors.bpm.message}
          </p>
        )}
      </div>

      {/* Musical Key */}
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
            <SelectValue placeholder="Select key" />
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

      {/* Key Signature */}
      <div className="space-y-1.5">
        <Label>Key Signature *</Label>
        <Select
          value={form.watch("keySignature")}
          onValueChange={(v) =>
            form.setValue("keySignature", v as "major" | "minor", {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select major or minor" />
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

      {/* Lyrics — collapsed by default */}
      <div className="space-y-1.5">
        {!showLyrics && !form.getValues("lyrics") ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLyrics(true)}
            className="text-muted-foreground"
          >
            + Add lyrics
          </Button>
        ) : (
          <>
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              {...form.register("lyrics")}
              placeholder="Enter lyrics..."
              rows={6}
            />
          </>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Song"}
      </Button>
    </form>
  );
}
