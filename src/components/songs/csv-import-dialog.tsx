"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, XCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { songApiSchema, MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";
import type { SongFormValues } from "@/lib/validations/song";

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

// Maps flexible CSV header names → internal field names
function mapRow(raw: Record<string, string>): Partial<SongFormValues> & { tags: string[] } {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== "") return v;
    }
    return "";
  };

  const tagsRaw = get("tags", "tag");
  const tags = tagsRaw
    ? tagsRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    name: get("name"),
    bpm: get("bpm") as any,
    musicalKey: get("key", "musicalkey", "musical_key") as any,
    keySignature: get("keysig", "keysignature", "key_sig", "key_signature") as any,
    timeSignature: (get("timesig", "timesignature", "time_sig", "time_signature") || "4/4") as any,
    chordProgressions: get("chords", "chord", "chordprogressions", "chord_progressions"),
    lyrics: get("lyrics") || undefined,
    youtubeUrl: get("youtube", "youtubeurl", "youtube_url") || "",
    spotifyUrl: get("spotify", "spotifyurl", "spotify_url") || "",
    tags,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParsedRow = {
  index: number;
  mapped: ReturnType<typeof mapRow>;
  validated: SongFormValues | null;
  errors: string[];
};

type Step = "upload" | "preview" | "importing" | "done";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CsvImportDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.validated !== null);
  const invalidRows = rows.filter((r) => r.validated === null);

  function reset() {
    setStep("upload");
    setRows([]);
    setDragOver(false);
    setImportedCount(0);
    setImportError(null);
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rawRows = parseCsv(text);
      const parsed: ParsedRow[] = rawRows.map((raw, i) => {
        const mapped = mapRow(raw);
        const result = songApiSchema.safeParse(mapped);
        if (result.success) {
          return { index: i + 1, mapped, validated: result.data, errors: [] };
        }
        const errors = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        );
        return { index: i + 1, mapped, validated: null, errors };
      });
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setStep("importing");
    setImportError(null);
    try {
      const res = await fetch("/api/songs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs: validRows.map((r) => r.validated) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setImportError(data.error ? JSON.stringify(data.error) : "Import failed");
        setStep("preview");
        return;
      }
      const data = await res.json();
      setImportedCount(data.imported);
      setStep("done");
      onSuccess();
    } catch {
      setImportError("Network error — please try again");
      setStep("preview");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" /> Import CSV
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>
              {step === "upload" && "Import songs from CSV"}
              {step === "preview" && `Preview — ${rows.length} rows found`}
              {step === "importing" && "Importing…"}
              {step === "done" && "Import complete"}
            </DialogTitle>
          </DialogHeader>

          {/* Upload step */}
          {step === "upload" && (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                CSV must have headers. Required:{" "}
                <code className="text-xs bg-muted px-1 rounded">name</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">bpm</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">key</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">keySig</code>.
                Optional: <code className="text-xs bg-muted px-1 rounded">timeSig</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">chords</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">lyrics</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">youtube</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">spotify</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">tags</code>.
              </p>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50",
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Drop your CSV here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Only .csv files</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <p className="text-xs text-muted-foreground">
                Valid keys: {MUSICAL_KEYS.join(", ")}
                <br />
                Valid key signatures: major, minor
                <br />
                Valid time signatures (optional, defaults to 4/4): {TIME_SIGNATURES.join(", ")}
              </p>
            </div>
          )}

          {/* Preview step */}
          {step === "preview" && (
            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {invalidRows.length} invalid (will be skipped)
                  </span>
                )}
              </div>

              {importError && (
                <p className="text-sm text-destructive">{importError}</p>
              )}

              <div className="overflow-auto flex-1 rounded border text-xs">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
                      <th className="px-2 py-1.5 text-left font-medium">Name</th>
                      <th className="px-2 py-1.5 text-left font-medium w-14">BPM</th>
                      <th className="px-2 py-1.5 text-left font-medium w-16">Key</th>
                      <th className="px-2 py-1.5 text-left font-medium w-16">Sig</th>
                      <th className="px-2 py-1.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.index}
                        className={cn(
                          "border-t",
                          row.validated ? "bg-green-50/40 dark:bg-green-950/20" : "bg-red-50/40 dark:bg-red-950/20",
                        )}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.index}</td>
                        <td className="px-2 py-1.5 max-w-[160px] truncate">{String(row.mapped.name)}</td>
                        <td className="px-2 py-1.5">{String(row.mapped.bpm)}</td>
                        <td className="px-2 py-1.5">{String(row.mapped.musicalKey)}</td>
                        <td className="px-2 py-1.5">{String(row.mapped.keySignature)}</td>
                        <td className="px-2 py-1.5">
                          {row.validated ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="text-destructive" title={row.errors.join("; ")}>
                              <XCircle className="h-3 w-3 inline mr-1" />
                              {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Importing step */}
          {step === "importing" && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Importing {validRows.length} songs…
            </div>
          )}

          {/* Done step */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">{importedCount} songs imported</p>
              {invalidRows.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {invalidRows.length} rows were skipped due to validation errors.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {step === "preview" && (
              <>
                <Button variant="outline" onClick={reset}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={validRows.length === 0}>
                  Import {validRows.length} song{validRows.length !== 1 ? "s" : ""}
                </Button>
              </>
            )}
            {step === "done" && (
              <Button onClick={() => handleClose(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
