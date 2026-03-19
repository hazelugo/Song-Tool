"use client";

import { cn } from "@/lib/utils";
import type { SongWithTags } from "@/db/schema";
import { getCamelotPosition, formatCamelot } from "@/lib/camelot";
import { Youtube, ExternalLink } from "lucide-react";

const LANGUAGE_TAGS = ["spanish", "english"];

interface ChainCardProps {
  song: SongWithTags;
  isSelected: boolean;
  isSeed?: boolean;
  onClick: () => void;
}

export function ChainCard({ song, isSelected, isSeed, onClick }: ChainCardProps) {
  const camelot = getCamelotPosition(song.musicalKey, song.keySignature);
  const camelotLabel = camelot ? formatCamelot(camelot) : null;
  const langTag = song.tags.find((t) =>
    LANGUAGE_TAGS.includes(t.name.toLowerCase()),
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-sm border border-l-2 p-3 transition-all duration-150 group",
        isSelected
          ? "border-[color:var(--color-chart-4)]/60 border-l-[color:var(--color-chart-4)] bg-muted/25 opacity-100"
          : isSeed
            ? "border-border/60 border-l-[color:var(--color-chart-4)]/50 bg-card opacity-100 cursor-default"
            : "border-border/30 border-l-transparent bg-card opacity-45 hover:opacity-75 hover:border-border/60 hover:bg-muted/10",
      )}
    >
      {/* Musical data row */}
      <div className="flex flex-wrap gap-1 mb-2">
        {song.bpm && (
          <span className="text-[10px] font-mono tabular-nums px-1.5 rounded-sm bg-muted/60 border border-border/40 h-4 inline-flex items-center leading-none">
            {song.bpm}
          </span>
        )}
        <span className="text-[10px] font-mono px-1.5 rounded-sm bg-muted/60 border border-border/40 h-4 inline-flex items-center leading-none">
          {song.musicalKey} {song.keySignature}
        </span>
        {camelotLabel && (
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 rounded-sm bg-muted/30 border border-border/25 h-4 inline-flex items-center leading-none">
            {camelotLabel}
          </span>
        )}
      </div>

      {/* Song name */}
      <p
        className={cn(
          "text-sm font-medium leading-snug line-clamp-2 transition-colors",
          isSelected || isSeed ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80",
        )}
      >
        {song.name}
      </p>

      {/* Bottom row: language tag + links */}
      <div className="flex items-center justify-between mt-1.5 gap-2">
        {langTag ? (
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">
            {langTag.name}
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-1.5 shrink-0">
          {song.youtubeUrl && (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Youtube className="size-3" />
            </a>
          )}
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </button>
  );
}
