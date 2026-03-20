"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { playTick } from "@/lib/audio";
import { TIME_SIGNATURES } from "@/lib/validations/song";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

function MetronomeContent() {
  const searchParams = useSearchParams();

  const initBpm = Math.min(
    200,
    Math.max(50, parseInt(searchParams.get("bpm") ?? "120", 10) || 120),
  );
  const rawTimeSig = searchParams.get("timeSig") ?? "";
  const initTimeSig = (TIME_SIGNATURES as readonly string[]).includes(rawTimeSig)
    ? (rawTimeSig as (typeof TIME_SIGNATURES)[number])
    : "4/4";

  const [bpm, setBpm] = useState(initBpm);
  const [bpmInput, setBpmInput] = useState(String(initBpm));
  const [timeSig, setTimeSig] = useState<(typeof TIME_SIGNATURES)[number]>(initTimeSig);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(parseInt(timeSig.split("/")[0], 10));

  // Keep refs in sync with state
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => {
    beatsRef.current = parseInt(timeSig.split("/")[0], 10);
  }, [timeSig]);

  const beatsInMeasure = parseInt(timeSig.split("/")[0], 10);

  const schedulerLoop = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const beat = beatCountRef.current % beatsRef.current;
      playTick(beat === 0, ctx, nextBeatTimeRef.current);

      const delay = (nextBeatTimeRef.current - ctx.currentTime) * 1000;
      setTimeout(() => setCurrentBeat(beat), Math.max(0, delay));

      nextBeatTimeRef.current += 60 / bpmRef.current;
      beatCountRef.current++;
    }
  }, []);

  const start = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    beatCountRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime;
    setCurrentBeat(0);
    setIsPlaying(true);

    schedulerLoop(); // schedule beat 1 immediately, before the interval fires
    schedulerRef.current = setInterval(schedulerLoop, LOOKAHEAD_MS);
  }, [schedulerLoop]);

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md mx-auto w-full bg-card border border-border/40 rounded-sm">
      {/* Header row — DAW toolbar style */}
      <div className="border-b border-border/60 pb-3">
        <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metronome</h1>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>BPM: {bpm}</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={50}
              max={200}
              value={bpmInput}
              onChange={(e) => setBpmInput(e.target.value)}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                const clamped = isNaN(val) ? bpm : Math.min(200, Math.max(50, val));
                setBpm(clamped);
                setBpmInput(String(clamped));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-24"
            />
            <input
              type="range"
              min={50}
              max={200}
              value={bpm}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setBpm(val);
                setBpmInput(String(val));
              }}
              className="flex-1 accent-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time Signature</Label>
          <Select
            value={timeSig}
            onValueChange={(v) => setTimeSig(v as (typeof TIME_SIGNATURES)[number])}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SIGNATURES.map((sig) => (
                <SelectItem key={sig} value={sig}>
                  {sig}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Beat indicators */}
      <div className="flex gap-3 items-center justify-center flex-wrap">
        {Array.from({ length: beatsInMeasure }, (_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-75",
              i === 0 ? "w-6 h-6" : "w-4 h-4",
              currentBeat === i && isPlaying
                ? "bg-primary scale-125"
                : i === 0
                  ? "bg-muted-foreground/50 ring-2 ring-primary/50"
                  : "bg-muted-foreground/30",
            )}
          />
        ))}
      </div>

      <div className="flex justify-center">
        {isPlaying ? (
          <Button onClick={stop} variant="default" size="lg" className="rounded-sm">
            Stop
          </Button>
        ) : (
          <Button onClick={start} size="lg" className="rounded-sm">
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MetronomePage() {
  return (
    <Suspense>
      <MetronomeContent />
    </Suspense>
  );
}
