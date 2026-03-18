"use client";

import { Badge } from "@/components/ui/badge";
import type { SongWithTags } from "@/db/schema";
import { getCamelotPosition, formatCamelot } from "@/lib/camelot";
import { Youtube, ExternalLink } from "lucide-react";

function bpmStyle(bpm: number) {
  if (bpm < 90) return "bg-[color:var(--color-chart-4)]/10 text-[color:var(--color-chart-2)] border border-[color:var(--color-chart-4)]/25";
  if (bpm < 120) return "bg-[color:var(--color-chart-3)]/10 text-[color:var(--color-chart-2)] border border-[color:var(--color-chart-3)]/25";
  return "bg-[color:var(--color-accent-data)]/10 text-[color:var(--color-accent-data)] border border-[color:var(--color-accent-data)]/25";
}

interface SongCardProps {
  song: SongWithTags;
  onClick: (song: SongWithTags) => void;
  onFindSimilar?: (song: SongWithTags) => void;
}

export function SongCard({ song, onClick, onFindSimilar }: SongCardProps) {
  const camelot = getCamelotPosition(song.musicalKey, song.keySignature);
  const camelotLabel = camelot ? formatCamelot(camelot) : null;
  const chords = (song.chordProgressions as string[]) ?? [];
  const visibleChords = chords.slice(0, 4);
  const extraChords = chords.length - visibleChords.length;

  return (
    <div
      onClick={() => onClick(song)}
      className="group relative cursor-pointer rounded-sm border border-border/60 bg-card p-4 hover:border-[color:var(--color-chart-4)]/60 hover:bg-muted/20 transition-all duration-150 border-l-2 border-l-transparent hover:border-l-[color:var(--color-chart-4)]"
    >
      {/* Musical data FIRST — hero row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {song.bpm && (
          <span className={`inline-flex items-center text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-sm ${bpmStyle(song.bpm)}`}>
            {song.bpm} BPM
          </span>
        )}
        <Badge variant="secondary" className="text-xs font-mono rounded-sm px-1.5 py-0 gap-1 h-5">
          {song.musicalKey} {song.keySignature}
          {camelotLabel && (
            <span className="opacity-50 font-mono">· {camelotLabel}</span>
          )}
        </Badge>
        <Badge variant="outline" className="text-xs font-mono rounded-sm px-1.5 py-0 h-5 tabular-nums">
          {song.timeSignature}
        </Badge>
      </div>

      {/* Song name below the data */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
          {song.name}
        </h3>
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          {song.youtubeUrl && (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition-colors"
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
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Spotify"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Chord progressions */}
      {chords.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mr-0.5">Chords</span>
            {visibleChords.map((chord, i) => (
              <span
                key={i}
                className="text-xs bg-muted/60 px-1.5 py-0 rounded-sm font-mono border border-border/40 h-5 inline-flex items-center"
              >
                {chord}
              </span>
            ))}
            {extraChords > 0 && (
              <span className="text-xs text-muted-foreground font-mono">+{extraChords}</span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {song.tags.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {song.tags.slice(0, 6).map((tag) => (
            <span key={tag.id} className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {tag.name}
            </span>
          ))}
          {song.tags.length > 6 && (
            <span className="text-[10px] text-muted-foreground">
              +{song.tags.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Find similar — revealed on hover */}
      {onFindSimilar && (
        <div className="mt-3 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFindSimilar(song);
            }}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Find similar →
          </button>
        </div>
      )}
    </div>
  );
}
