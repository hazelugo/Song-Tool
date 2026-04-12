/**
 * ChordPro-inspired lyrics parser, renderer, and transposer.
 *
 * Format:
 *   [G]Amazing [D]grace  — inline chord markers
 *   **bold**, _italic_   — text formatting
 *   {center}A line       — center-align directive
 *   {chorus}, {verse}    — section labels
 */

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const FLAT_TO_IDX: Record<string, number> = {
  Db: 1, Eb: 3, Fb: 4, Gb: 6, Ab: 8, Bb: 10, Cb: 11,
};

function noteToIndex(note: string): number {
  const si = SHARPS.indexOf(note);
  if (si !== -1) return si;
  return FLAT_TO_IDX[note] ?? -1;
}

/** Transpose a single chord name by `steps` semitones. */
export function transposeChord(chord: string, steps: number): string {
  if (steps === 0) return chord;

  // Slash chords: G/B — transpose both parts
  const slashIdx = chord.lastIndexOf('/');
  if (slashIdx > 0) {
    return (
      transposeChord(chord.slice(0, slashIdx), steps) +
      '/' +
      transposeChord(chord.slice(slashIdx + 1), steps)
    );
  }

  // Determine root (2-char flat/sharp or 1-char natural)
  const twoChar = chord.slice(0, 2);
  let root: string;
  let quality: string;

  if (
    SHARPS.includes(twoChar) ||
    twoChar in FLAT_TO_IDX
  ) {
    root = twoChar;
    quality = chord.slice(2);
  } else if (/^[A-G]/.test(chord)) {
    root = chord[0];
    quality = chord.slice(1);
  } else {
    return chord; // unrecognized — leave unchanged
  }

  const idx = noteToIndex(root);
  if (idx === -1) return chord;

  const newIdx = ((idx + steps) % 12 + 12) % 12;
  // Prefer sharps going up, flats going down
  const newRoot = steps > 0 ? SHARPS[newIdx] : FLATS[newIdx];

  return newRoot + quality;
}

/** Replace every [chord] token in a full lyrics string. */
export function transposeLyrics(text: string, steps: number): string {
  if (steps === 0) return text;
  return text.replace(/\[([^\]]+)\]/g, (_, chord) => `[${transposeChord(chord, steps)}]`);
}

// ---------------------------------------------------------------------------
// Line parser
// ---------------------------------------------------------------------------

export type ParsedLine =
  | { type: 'chord-lyric'; segments: Array<{ chord: string; text: string }> }
  | { type: 'directive'; directive: string; value?: string }
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; center?: boolean };

/** Parse one line of ChordPro text into a structured token. */
export function parseChordProLine(line: string): ParsedLine {
  const trimmed = line.trim();

  // Directive: {name} or {name: value}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1);
    const colon = inner.indexOf(':');
    if (colon !== -1) {
      return {
        type: 'directive',
        directive: inner.slice(0, colon).trim(),
        value: inner.slice(colon + 1).trim(),
      };
    }
    return { type: 'directive', directive: inner.trim() };
  }

  // Chord-lyric line: contains at least one [chord] marker
  if (/\[[^\]]+\]/.test(line)) {
    const segments: Array<{ chord: string; text: string }> = [];

    // Text before the first chord gets an empty-chord segment
    const firstMatch = /\[([^\]]+)\]/.exec(line);
    let remaining = line;
    if (firstMatch && firstMatch.index > 0) {
      segments.push({ chord: '', text: line.slice(0, firstMatch.index) });
      remaining = line.slice(firstMatch.index);
    }

    const re = /\[([^\]]+)\]([^\[]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(remaining)) !== null) {
      segments.push({ chord: m[1], text: m[2] });
    }

    if (segments.length > 0) {
      return { type: 'chord-lyric', segments };
    }
  }

  // Plain text — check for formatting
  let text = line;
  let center = false;

  if (text.startsWith('{center}')) {
    center = true;
    text = text.slice(8);
  }

  return { type: 'text', text, center };
}

// ---------------------------------------------------------------------------
// HTML export (for print)
// ---------------------------------------------------------------------------

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Apply **bold** and _italic_ markdown to an already-escaped string. */
export function applyInlineFormatting(raw: string): string {
  return escHtml(raw)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

/**
 * Convert a full ChordPro lyrics string to print-ready inner HTML.
 * Caller is responsible for wrapping in a container with the print CSS.
 */
export function lyricsToHtml(text: string | null | undefined): string {
  if (!text?.trim()) return '<span class="no-lyrics">No lyrics saved</span>';

  return text
    .split('\n')
    .map((line) => {
      const parsed = parseChordProLine(line);

      if (parsed.type === 'chord-lyric') {
        const segs = parsed.segments
          .map(
            (seg) =>
              `<span class="chord-segment">` +
              `<span class="chord">${seg.chord ? escHtml(seg.chord) : '\u00a0'}</span>` +
              `<span class="lyric">${applyInlineFormatting(seg.text) || '\u00a0'}</span>` +
              `</span>`,
          )
          .join('');
        return `<div class="chord-line">${segs}</div>`;
      }

      if (parsed.type === 'directive') {
        const label = parsed.value
          ? `${parsed.directive}: ${parsed.value}`
          : parsed.directive;
        return `<div class="directive">${escHtml(label)}</div>`;
      }

      // text line
      if (!parsed.text.trim()) return '<div class="lyric-blank"></div>';
      const style = parsed.center ? ' style="text-align:center"' : '';
      return `<div class="lyric-line"${style}>${applyInlineFormatting(parsed.text)}</div>`;
    })
    .join('');
}

/** CSS to embed in print HTML alongside lyricsToHtml output. */
export const LYRICS_PRINT_CSS = `
  .chord-line { display: flex; flex-wrap: wrap; align-items: flex-end; margin-bottom: 2px; }
  .chord-segment { display: inline-flex; flex-direction: column; margin-right: 1px; }
  .chord { font-size: 11px; color: #555; font-family: monospace; display: block; min-height: 14px; line-height: 1.2; }
  .lyric { font-size: 15px; line-height: 1.6; }
  .lyric-line { font-size: 15px; line-height: 1.8; }
  .lyric-blank { height: 12px; }
  .directive { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; padding-top: 14px; padding-bottom: 4px; }
  .no-lyrics { color: #aaa; font-style: italic; }
`;
