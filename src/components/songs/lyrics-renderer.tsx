"use client";
import { parseChordProLine, transposeLyrics, applyInlineFormatting } from "@/lib/chordpro";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  transposedSteps?: number;
}

export function LyricsRenderer({ text, transposedSteps = 0 }: Props) {
  const content = transposedSteps !== 0 ? transposeLyrics(text, transposedSteps) : text;
  const lines = content.split("\n");

  return (
    <div className="space-y-0.5 select-text">
      {lines.map((line, i) => {
        const parsed = parseChordProLine(line);

        if (parsed.type === "chord-lyric") {
          return (
            <div key={i} className="flex flex-wrap items-end leading-none">
              {parsed.segments.map((seg, j) => (
                <span key={j} className="inline-flex flex-col mr-0.5">
                  {/* Chord row */}
                  <span className="font-mono text-[11px] text-primary/70 leading-none mb-0.5 min-h-[14px] whitespace-pre">
                    {seg.chord || ""}
                  </span>
                  {/* Lyric row */}
                  <span className="font-sans text-sm text-foreground/90 leading-snug whitespace-pre">
                    {seg.text || "\u00a0"}
                  </span>
                </span>
              ))}
            </div>
          );
        }

        if (parsed.type === "directive") {
          const label = parsed.value
            ? `${parsed.directive}: ${parsed.value}`
            : parsed.directive;
          return (
            <div
              key={i}
              className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-sans pt-4 pb-1"
            >
              — {label} —
            </div>
          );
        }

        // text line
        if (!parsed.text.trim()) {
          return <div key={i} className="h-3" />;
        }

        return (
          <div
            key={i}
            className={cn(
              "font-sans text-sm text-foreground/90 leading-snug",
              parsed.center && "text-center",
            )}
            dangerouslySetInnerHTML={{ __html: applyInlineFormatting(parsed.text) }}
          />
        );
      })}
    </div>
  );
}
