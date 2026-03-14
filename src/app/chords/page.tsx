"use client";
import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { playChord } from "@/lib/audio";
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

  const audioCtxRef = useRef<AudioContext | null>(null);

  const handlePadClick = useCallback((chord: ChordDef) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    playChord(chord.frequencies, ctx);
    setActiveChord(chord.label);
    setTimeout(() => setActiveChord(null), 1800);
  }, []);

  const chords = getDiatonicChords(key, keySig);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Chord Pads</h1>

      <div className="flex gap-6">
        <div className="space-y-2">
          <Label>Key</Label>
          <Select
            value={key}
            onValueChange={(v) => setKey(v as (typeof MUSICAL_KEYS)[number])}
          >
            <SelectTrigger className="w-24">
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

        <div className="space-y-2">
          <Label>Mode</Label>
          <Select value={keySig} onValueChange={(v) => setKeySig(v as KeySig)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {chords.map((chord, i) => (
          <button
            key={i}
            onClick={() => handlePadClick(chord)}
            className={cn(
              "h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
              "hover:scale-105 active:scale-95",
              chord.quality === "major" &&
                "bg-primary/10 border-primary/40 hover:bg-primary/20",
              chord.quality === "minor" &&
                "bg-secondary/20 border-secondary-foreground/30 hover:bg-secondary/40",
              chord.quality === "dim" &&
                "bg-orange-500/10 border-orange-500/40 hover:bg-orange-500/20",
              activeChord === chord.label &&
                "ring-2 ring-primary scale-105 brightness-110",
            )}
          >
            <span className="text-xs text-muted-foreground">{chord.roman}</span>
            <span className="text-lg font-bold">{chord.label}</span>
            <span className="text-xs capitalize text-muted-foreground">
              {chord.quality}
            </span>
          </button>
        ))}
        {/* Empty 8th slot */}
        <div className="h-24 rounded-xl border-2 border-dashed border-muted/30" />
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
