"use client";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LyricsRenderer } from "./lyrics-renderer";
import { transposeLyrics } from "@/lib/chordpro";
import { Bold, Italic, AlignCenter, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}

export function LyricsEditor({ open, onOpenChange, value, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [showChordInput, setShowChordInput] = useState(false);
  const [chordInput, setChordInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft and reset state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setDraft(value);
      setTab("edit");
      setTransposeSteps(0);
      setShowChordInput(false);
      setChordInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Toolbar helpers ──────────────────────────────────────────────────────

  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const next =
      draft.slice(0, s) + before + draft.slice(s, e) + after + draft.slice(e);
    setDraft(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, e + before.length);
    }, 0);
  }

  function centerSelectedLines() {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = draft.slice(s, e) || draft.slice(
      draft.lastIndexOf("\n", s - 1) + 1,
      draft.indexOf("\n", e) === -1 ? draft.length : draft.indexOf("\n", e),
    );
    const replaced = selected
      .split("\n")
      .map((l) => (l.startsWith("{center}") ? l : `{center}${l}`))
      .join("\n");
    const insertAt = e === s
      ? draft.lastIndexOf("\n", s - 1) + 1
      : s;
    const endAt = e === s
      ? (draft.indexOf("\n", s) === -1 ? draft.length : draft.indexOf("\n", s))
      : e;
    setDraft(draft.slice(0, insertAt) + replaced + draft.slice(endAt));
  }

  function insertChord() {
    const chord = chordInput.trim();
    if (!chord) return;
    const ta = textareaRef.current;
    const pos = ta?.selectionStart ?? draft.length;
    const token = `[${chord}]`;
    setDraft(draft.slice(0, pos) + token + draft.slice(pos));
    setChordInput("");
    setShowChordInput(false);
    setTimeout(() => {
      ta?.focus();
      ta?.setSelectionRange(pos + token.length, pos + token.length);
    }, 0);
  }

  // ── Transpose helpers ────────────────────────────────────────────────────

  function applyTranspose() {
    setDraft(transposeLyrics(draft, transposeSteps));
    setTransposeSteps(0);
  }

  // ── Save / cancel ────────────────────────────────────────────────────────

  function handleSave() {
    onChange(draft);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  // ────────────────────────────────────────────────────────────────────────

  const stLabel =
    transposeSteps === 0 ? "0 st" : transposeSteps > 0 ? `+${transposeSteps} st` : `${transposeSteps} st`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0">
        {/* Header + tab toggle */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Lyrics</DialogTitle>
            <div className="flex rounded-sm overflow-hidden border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className={cn(
                  "px-3 py-1 transition-colors",
                  tab === "edit"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={cn(
                  "px-3 py-1 border-l border-border/60 transition-colors",
                  tab === "preview"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Preview
              </button>
            </div>
          </div>
        </DialogHeader>

        {tab === "edit" ? (
          <>
            {/* Toolbar */}
            <div className="px-4 py-1.5 border-b flex items-center gap-0.5 shrink-0 bg-background/50">
              <ToolbarBtn title="Bold — wraps selection in **...**" onClick={() => wrapSelection("**", "**")}>
                <Bold className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Italic — wraps selection in _..._" onClick={() => wrapSelection("_", "_")}>
                <Italic className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Center — prefixes lines with {center}" onClick={centerSelectedLines}>
                <AlignCenter className="h-3.5 w-3.5" />
              </ToolbarBtn>

              <div className="w-px h-4 bg-border mx-1 shrink-0" />

              {showChordInput ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={chordInput}
                    onChange={(e) => setChordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); insertChord(); }
                      if (e.key === "Escape") { setShowChordInput(false); setChordInput(""); }
                    }}
                    placeholder="Am7"
                    className="h-6 w-20 text-xs font-mono px-2 py-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={insertChord}
                    className="text-xs text-primary hover:underline font-mono"
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowChordInput(false); setChordInput(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <ToolbarBtn
                  title="Insert chord marker at cursor"
                  onClick={() => setShowChordInput(true)}
                  className="flex items-center gap-1 px-2"
                >
                  <Music className="h-3.5 w-3.5" />
                  <span className="text-xs">+ Chord</span>
                </ToolbarBtn>
              )}

              <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono hidden sm:block">
                [G]word [Am]above
              </span>
            </div>

            {/* Editor */}
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                "[G]Amazing [D]grace, how [Em]sweet the [C]sound\n" +
                "That [G]saved a [D]wretch like [G]me\n\n" +
                "Use [Chord] markers to place chords above syllables.\n" +
                "**bold**  _italic_  {center}centered line"
              }
              className="flex-1 resize-none rounded-none border-0 focus-visible:ring-0 font-mono text-sm leading-relaxed px-6 py-4"
            />
          </>
        ) : (
          <>
            {/* Transpose controls */}
            <div className="px-6 py-2 border-b flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground font-mono">Transpose</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTransposeSteps((n) => n - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-foreground/10 font-mono text-sm leading-none"
                >
                  −
                </button>
                <span className="w-14 text-center text-xs font-mono tabular-nums text-foreground">
                  {stLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setTransposeSteps((n) => n + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-foreground/10 font-mono text-sm leading-none"
                >
                  +
                </button>
              </div>
              {transposeSteps !== 0 && (
                <button
                  type="button"
                  onClick={applyTranspose}
                  className="text-xs text-primary hover:underline"
                >
                  Apply to lyrics
                </button>
              )}
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {draft.trim() ? (
                <LyricsRenderer text={draft} transposedSteps={transposeSteps} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No lyrics yet. Switch to Edit to add some.
                </p>
              )}
            </div>
          </>
        )}

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save lyrics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}
