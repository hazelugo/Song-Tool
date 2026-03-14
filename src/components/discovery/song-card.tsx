"use client";

import { Badge } from "@/components/ui/badge";
import type { SongWithTags } from "@/db/schema";
import { getCamelotPosition, formatCamelot } from "@/lib/camelot";
import { Youtube, ExternalLink } from "lucide-react";

function bpmStyle(bpm: number) {
  if (bpm < 90) return "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400";
  if (bpm < 120) return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400";
  return "bg-orange-500/10 text-orange-600 border border-orange-500/20 dark:text-orange-400";
}

interface SongCardProps {
  song: SongWithTags;
  onClick: (song: SongWithTags) => void;
}

export function SongCard({ song, onClick }: SongCardProps) {
  const camelot = getCamelotPosition(song.musicalKey, song.keySignature);
  const camelotLabel = camelot ? formatCamelot(camelot) : null;
  const chords = (song.chordProgressions as string[]) ?? [];
  const visibleChords = chords.slice(0, 4);
  const extraChords = chords.length - visibleChords.length;

  return (
    <div
      onClick={() => onClick(song)}
      className="group relative cursor-pointer rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {song.name}
        </h3>
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          {song.youtubeUrl && (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="YouTube"
            >
              <Youtube className="size-3.5" />
            </a>
          )}
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-green-500 transition-colors"
              title="Spotify"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Musical stats */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {song.bpm && (
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${bpmStyle(song.bpm)}`}>
            {song.bpm} BPM
          </span>
        )}
        <Badge variant="secondary" className="text-xs gap-1">
          {song.musicalKey} {song.keySignature}
          {camelotLabel && (
            <span className="opacity-50">· {camelotLabel}</span>
          )}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {song.timeSignature}
        </Badge>
      </div>

      {/* Chord progressions */}
      {chords.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-0.5">Chords:</span>
            {visibleChords.map((chord, i) => (
              <span
                key={i}
                className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
              >
                {chord}
              </span>
            ))}
            {extraChords > 0 && (
              <span className="text-xs text-muted-foreground">+{extraChords}</span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {song.tags.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {song.tags.slice(0, 6).map((tag) => (
            <span key={tag.id} className="text-xs text-muted-foreground">
              #{tag.name}
            </span>
          ))}
          {song.tags.length > 6 && (
            <span className="text-xs text-muted-foreground">
              +{song.tags.length - 6}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
