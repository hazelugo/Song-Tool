"use client";
import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { playChord, stopChord, type ActiveChordNodes } from "@/lib/audio";
import { getDiatonicChords, type ChordDef } from "@/lib/chords";
import { MUSICAL_KEYS } from "@/lib/validations/song";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type KeySig = "major" | "minor";

const WAVEFORMS: { type: OscillatorType; label: string; character: string }[] = [
  { type: "sine",     label: "Sine",     character: "Clean, smooth" },
  { type: "triangle", label: "Triangle", character: "Warm, rounded" },
  { type: "sawtooth", label: "Sawtooth", character: "Bright, buzzy" },
  { type: "square",   label: "Square",   character: "Hollow, reedy" },
];

function ChordPadsContent() {
  const searchParams = useSearchParams();

  const rawKey = searchParams.get("key") ?? "";
  const initKey = (MUSICAL_KEYS as readonly string[]).includes(rawKey)
    ? (rawKey as (typeof MUSICAL_KEYS)[number])
    : "C";
  const initKeySig: KeySig =
    searchParams.get("keySig") === "minor" ? "minor" : "major";

  const [key, setKey] = useState<(typeof MUSICAL_KEYS)[number]>(initKey);
  const [keySig, setKeySig] = useState<KeySig>(initKeySig);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<OscillatorType>("sine");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<ActiveChordNodes | null>(null);

  const handlePadClick = useCallback((chord: ChordDef) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    // Stop the previous chord before starting a new one
    if (activeNodesRef.current) {
      stopChord(activeNodesRef.current, ctx);
      activeNodesRef.current = null;
    }

    activeNodesRef.current = playChord(chord.frequencies, ctx, waveform);
    setActiveChord(chord.label);
    setTimeout(() => setActiveChord(null), 1800);
  }, [waveform]);

  const chords = getDiatonicChords(key, keySig);

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full bg-card border border-border/40 rounded-sm">
      {/* Header row — DAW toolbar style */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Chord Pads
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Key</Label>
            <Select
              value={key}
              onValueChange={(v) => setKey(v as (typeof MUSICAL_KEYS)[number])}
            >
              <SelectTrigger className="h-10 md:h-7 w-20 text-xs rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSICAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Mode</Label>
            <Select value={keySig} onValueChange={(v) => setKeySig(v as KeySig)}>
              <SelectTrigger className="h-10 md:h-7 w-24 text-xs rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {chords.map((chord, i) => (
          <button
            key={i}
            onClick={() => handlePadClick(chord)}
            className={cn(
              "h-20 rounded-sm border flex flex-col items-center justify-center gap-0.5",
              "transition-colors duration-75 cursor-pointer",
              "active:translate-y-px",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              chord.quality === "major" &&
                "bg-primary/5 border-border hover:bg-primary/10 hover:border-primary/30",
              chord.quality === "minor" &&
                "bg-transparent border-border hover:bg-muted/50",
              chord.quality === "dim" &&
                "bg-destructive/5 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40",
              activeChord === chord.label &&
                "border-[color:var(--color-chart-4)] bg-[color:var(--color-chart-4)]/10",
            )}
          >
            <span className="text-[10px] font-mono text-muted-foreground">{chord.roman}</span>
            <span className="text-base font-semibold font-mono">{chord.label}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {chord.quality}
            </span>
          </button>
        ))}
        {/* Empty 8th slot */}
        <div className="h-20 rounded-sm border border-dashed border-muted/30" />
      </div>

      {/* Waveform selector */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Sound
        </span>
        <div className="grid grid-cols-4 gap-2">
          {WAVEFORMS.map((w) => (
            <button
              key={w.type}
              type="button"
              onClick={() => setWaveform(w.type)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-14 rounded-sm border transition-colors duration-75",
                waveform === w.type
                  ? "border-[color:var(--color-chart-4)] bg-[color:var(--color-chart-4)]/10 text-foreground"
                  : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/30",
              )}
            >
              <span className="text-xs font-mono font-semibold">{w.label}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{w.character}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChordsPage() {
  return (
    <Suspense>
      <ChordPadsContent />
    </Suspense>
  );
}
