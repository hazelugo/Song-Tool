import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8 p-8 relative overflow-hidden bg-background"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 39px, oklch(1 0 0 / 0.025) 39px, oklch(1 0 0 / 0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, oklch(1 0 0 / 0.025) 39px, oklch(1 0 0 / 0.025) 40px)",
      }}
    >
      {/* Eyebrow */}
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-muted-foreground border border-border/60 rounded-sm px-3 py-1">
        Song Tool v1
      </span>

      {/* Hero headline */}
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight leading-none mb-4">
          Your catalog,
          <br />
          <span className="text-muted-foreground">under control.</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Search by key, BPM, mood, or chords. Build setlists in seconds.
          Built for working musicians.
        </p>
      </div>

      {/* CTA row */}
      <div className="flex gap-3">
        <Link
          href="/songs"
          className={buttonVariants({ variant: "default", size: "sm" }) + " rounded-sm text-xs h-7"}
        >
          Browse Songs
        </Link>
        <Link
          href="/discovery"
          className={buttonVariants({ variant: "default", size: "sm" }) + " rounded-sm text-xs h-7"}
        >
          Discovery
        </Link>
        <Link
          href="/playlists"
          className={buttonVariants({ variant: "default", size: "sm" }) + " rounded-sm text-xs h-7"}
        >
          Playlists
        </Link>
      </div>

      {/* Data strip — shows the kind of data this tool handles */}
      <div className="flex items-center gap-6 mt-4 text-muted-foreground/50">
        {[
          ["BPM", "128"],
          ["KEY", "F# min"],
          ["TIME", "4/4"],
          ["CAMELOT", "2A"],
        ].map(([label, val]) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.25em] font-medium">{label}</span>
            <span className="font-mono text-sm tabular-nums">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
