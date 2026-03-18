"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getCamelotPosition, formatCamelot } from "@/lib/camelot";
import type { SongWithTags } from "@/db/schema";

interface Props {
  playlistName: string;
  songs: SongWithTags[];
  backHref: string;
}

export function LiveMode({ playlistName, songs, backHref }: Props) {
  const [index, setIndex] = useState(0);
  const song = songs[index];

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(songs.length - 1, i + 1)),
    [songs.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (!song) return null;

  const camelot = getCamelotPosition(song.musicalKey, song.keySignature);

  return (
    <div className="fixed inset-0 bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {playlistName}
        </span>
        <div className="flex items-center gap-5">
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            {index + 1} / {songs.length}
          </span>
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Exit live mode"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main area: prev | content | next */}
      <div className="flex-1 flex items-stretch min-h-0">
        {/* Prev */}
        <button
          onClick={prev}
          disabled={index === 0}
          className="w-16 sm:w-24 flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-0 transition-colors"
          aria-label="Previous song"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        {/* Song card */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12 text-center overflow-y-auto">
          {/* Name */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight break-words max-w-2xl">
            {song.name}
          </h1>

          {/* Data strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            <DataField label="BPM" value={String(song.bpm)} />
            <DataField
              label="KEY"
              value={`${song.musicalKey} ${song.keySignature}`}
            />
            {camelot && (
              <DataField label="CAMELOT" value={formatCamelot(camelot)} />
            )}
            <DataField label="TIME" value={song.timeSignature} />
          </div>

          {/* Chords */}
          {song.chordProgressions && song.chordProgressions.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Chords
              </span>
              <p className="font-mono text-xl sm:text-2xl text-foreground/80 tracking-wide">
                {(song.chordProgressions as string[]).join("  —  ")}
              </p>
            </div>
          )}

          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {song.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-[11px] font-mono px-2 py-0.5 bg-muted rounded-sm text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Next */}
        <button
          onClick={next}
          disabled={index === songs.length - 1}
          className="w-16 sm:w-24 flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-0 transition-colors"
          aria-label="Next song"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {/* Progress dots — only when playlist fits */}
      {songs.length <= 24 && (
        <div className="flex justify-center items-center gap-1.5 py-4">
          {songs.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to song ${i + 1}`}
              className={`h-1 rounded-none transition-all duration-200 ${
                i === index
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}
