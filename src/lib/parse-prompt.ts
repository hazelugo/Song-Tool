import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";

export interface ParsedFilters {
  key?: string;
  keySig?: "major" | "minor";
  timeSig?: string;
  bpmMin?: number;
  bpmMax?: number;
  searchTerm?: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses a natural-language music search prompt into structured filter params.
 * No API key required — runs entirely locally.
 *
 * Examples:
 *   "G minor 80 BPM"        → { key: "G", keySig: "minor", bpmMin: 72, bpmMax: 88 }
 *   "upbeat dance 120+"     → { bpmMin: 120, searchTerm: "dance" }
 *   "dark ballad minor"     → { keySig: "minor", searchTerm: "dark ballad" }
 *   "F# major 90-110 bpm"   → { key: "F#", keySig: "major", bpmMin: 90, bpmMax: 110 }
 */
export function parsePrompt(raw: string): ParsedFilters {
  const filters: ParsedFilters = {};
  let text = " " + raw + " ";

  // 1. Time signature: "4/4", "3/4", "6/8", etc.
  for (const ts of TIME_SIGNATURES) {
    const re = new RegExp(`\\b${escapeRegex(ts)}\\b`);
    if (re.test(text)) {
      filters.timeSig = ts;
      text = text.replace(re, " ");
      break;
    }
  }

  // 2. Explicit BPM range: "80-120 bpm", "80–120 bpm", or bare "80-120" in tempo range
  let m = text.match(/\b(\d{2,3})\s*[-–]\s*(\d{2,3})\s*bpm?\b/i);
  if (!m) {
    const candidate = text.match(/\b(\d{2,3})\s*[-–]\s*(\d{2,3})\b/);
    if (candidate) {
      const lo = parseInt(candidate[1]), hi = parseInt(candidate[2]);
      if (lo >= 60 && hi <= 200 && lo < hi) m = candidate;
    }
  }
  if (m) {
    filters.bpmMin = parseInt(m[1]);
    filters.bpmMax = parseInt(m[2]);
    text = text.replace(m[0], " ");
  }

  // 3. Single BPM: "120 bpm", "120+ bpm", "around 120 bpm", "~120"
  if (filters.bpmMin === undefined) {
    m = text.match(/(?:around\s+|about\s+|~\s*)?(\d{2,3})\s*(\+?)\s*bpm?\b/i);
    if (m) {
      const bpm = parseInt(m[1]);
      if (bpm >= 40 && bpm <= 240) {
        if (m[2] === "+") {
          filters.bpmMin = bpm;
        } else {
          filters.bpmMin = Math.max(40, bpm - 8);
          filters.bpmMax = Math.min(240, bpm + 8);
        }
        text = text.replace(m[0], " ");
      }
    } else {
      // "around 120" / "~120" without "bpm"
      m = text.match(/(?:around|about|~)\s*(\d{2,3})\b/i);
      if (m) {
        const bpm = parseInt(m[1]);
        if (bpm >= 40 && bpm <= 240) {
          filters.bpmMin = Math.max(40, bpm - 8);
          filters.bpmMax = Math.min(240, bpm + 8);
          text = text.replace(m[0], " ");
        }
      }
    }
  }

  // 4. Mood-based BPM hints (only if no explicit BPM already set)
  if (filters.bpmMin === undefined && filters.bpmMax === undefined) {
    if (/\b(intense|hype|aggressive|very fast)\b/i.test(text)) {
      filters.bpmMin = 140;
    } else if (/\b(fast|upbeat|energetic|uptempo|up-tempo|driving)\b/i.test(text)) {
      filters.bpmMin = 115;
    } else if (/\b(medium|mid-?tempo|moderate|groovy)\b/i.test(text)) {
      filters.bpmMin = 85;
      filters.bpmMax = 115;
    } else if (/\b(slow|chill|relaxed|peaceful|calm|mellow|laid.?back)\b/i.test(text)) {
      filters.bpmMax = 85;
    }
  }

  // 5. Musical key — longest first so "F#" matches before "F", "Bb" before "B"
  const keysSorted = [...MUSICAL_KEYS].sort((a, b) => b.length - a.length);
  for (const k of keysSorted) {
    // Use negative lookbehind/lookahead to avoid partial matches
    const re = new RegExp(
      `(?<![a-zA-Z])${escapeRegex(k)}\\s*(major|minor)?(?![a-zA-Z0-9])`,
      "i",
    );
    const km = text.match(re);
    if (km) {
      filters.key = k;
      if (km[1]) filters.keySig = km[1].toLowerCase() as "major" | "minor";
      text = text.replace(km[0], " ");
      break;
    }
  }

  // 6. Standalone major/minor (if not already captured with key)
  if (!filters.keySig) {
    if (/\bminor\b/i.test(text)) {
      filters.keySig = "minor";
      text = text.replace(/\bminor\b/gi, " ");
    } else if (/\bmajor\b/i.test(text)) {
      filters.keySig = "major";
      text = text.replace(/\bmajor\b/gi, " ");
    }
  }

  // 7. Remaining words become searchTerm (matches song name, lyrics, and tags)
  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "of",
    "song", "songs", "track", "tracks", "music", "something", "give", "me",
    "find", "show", "want", "like", "key", "bpm", "tempo", "beat", "beats",
    "per", "minute", "i", "to", "some", "around", "about", "get", "that",
  ]);

  const words = text
    .toLowerCase()
    .split(/[\s,;.!?]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (words.length > 0) {
    filters.searchTerm = words.join(" ");
  }

  return filters;
}
