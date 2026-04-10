"use client";

import { Download, Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportSong {
  name: string;
  artist?: string | null;
  bpm: number | null;
  musicalKey: string | null;
  keySignature: string | null;
  timeSignature?: string | null;
  lyrics?: string | null;
  tags?: { name: string }[];
}

interface ExportMenuProps {
  playlistName: string;
  songs: ExportSong[];
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toSafeFilename(name: string) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

export function ExportMenu({ playlistName, songs }: ExportMenuProps) {
  const handleCsv = () => {
    const headers = ["Artist", "Name", "BPM", "Key", "Key Signature", "Time Signature", "Tags"];
    const rows = songs.map((s) => [
      `"${(s.artist ?? "").replace(/"/g, '""')}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      s.bpm ?? "",
      s.musicalKey ?? "",
      s.keySignature ?? "",
      s.timeSignature ? `="` + s.timeSignature.replace(/"/g, '""') + `"` : "",
      `"${(s.tags ?? []).map((t) => t.name).join(", ")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csv, `${toSafeFilename(playlistName)}.csv`, "text/csv");
  };

  const handleJson = () => {
    const data = {
      playlist: playlistName,
      exportedAt: new Date().toISOString(),
      songs: songs.map((s) => ({
        name: s.name,
        artist: s.artist ?? null,
        bpm: s.bpm,
        musicalKey: s.musicalKey,
        keySignature: s.keySignature,
        timeSignature: s.timeSignature ?? null,
        tags: (s.tags ?? []).map((t) => t.name),
      })),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `${toSafeFilename(playlistName)}.json`,
      "application/json",
    );
  };

  const handlePrintWithLyrics = () => {
    const pages = songs
      .map((s, i) => {
        const key = s.musicalKey
          ? `${s.musicalKey} ${s.keySignature ?? ""}`.trim()
          : "—";
        const bpm = s.bpm ?? "—";
        const timeSig = s.timeSignature ?? "—";
        const tags = (s.tags ?? []).map((t) => t.name).join(", ") || "—";
        const lyricsHtml = s.lyrics
          ? s.lyrics
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br />")
          : '<span class="no-lyrics">No lyrics saved</span>';
        return `<div class="page">
          <div class="song-header">
            <span class="song-number">${i + 1}</span>
            <div>
              <h2 class="song-title">${s.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
              ${s.artist ? `<span class="song-artist">${s.artist.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>` : ""}
            </div>
          </div>
          <div class="song-meta">
            <span>Key: <strong>${key}</strong></span>
            <span>BPM: <strong>${bpm}</strong></span>
            <span>Time Sig: <strong>${timeSig}</strong></span>
            <span>Tags: ${tags}</span>
          </div>
          <div class="lyrics">${lyricsHtml}</div>
        </div>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>${playlistName.replace(/</g, "&lt;")} — Lyrics Sheets</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #000; }
    .page {
      width: 100%;
      min-height: 100vh;
      padding: 48px 56px;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .page:last-child { page-break-after: avoid; }
    .song-header { display: flex; align-items: flex-start; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .song-number { font-size: 13px; color: #999; width: 20px; flex-shrink: 0; margin-top: 8px; }
    .song-title { font-size: 26px; font-weight: bold; }
    .song-artist { font-size: 14px; color: #555; display: block; margin-top: 2px; }
    .song-meta { display: flex; gap: 24px; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .song-meta strong { color: #000; }
    .lyrics { font-size: 15px; line-height: 1.8; white-space: pre-wrap; margin-top: 8px; flex: 1; }
    .no-lyrics { color: #aaa; font-style: italic; }
    @media print {
      .page { padding: 32px 40px; }
    }
  </style>
</head><body>${pages}</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handlePrint = () => {
    const rows = songs
      .map((s, i) => {
        const key = s.musicalKey
          ? `${s.musicalKey} ${s.keySignature ?? ""}`.trim()
          : "—";
        const bpm = s.bpm ?? "—";
        const timeSig = s.timeSignature ?? "—";
        const tags = (s.tags ?? []).map((t) => t.name).join(", ") || "—";
        return `<tr>
          <td>${i + 1}</td>
          <td>${s.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}${s.artist ? `<br /><span class="artist">${s.artist.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>` : ""}</td>
          <td>${key}</td>
          <td>${bpm}</td>
          <td>${timeSig}</td>
          <td>${tags}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>${playlistName.replace(/</g, "&lt;")} — Setlist</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #000; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 2px solid #000; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    td:first-child { color: #999; width: 28px; }
    .artist { font-size: 12px; color: #666; }
    @media print { body { margin: 20px; } }
  </style>
</head><body>
  <h1>${playlistName.replace(/</g, "&lt;")}</h1>
  <p class="meta">${songs.length} song${songs.length !== 1 ? "s" : ""} &middot; Printed ${new Date().toLocaleDateString()}</p>
  <table>
    <thead><tr><th>#</th><th>Song</th><th>Key</th><th>BPM</th><th>Time Sig</th><th>Tags</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCsv}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleJson}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Setlist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintWithLyrics}>
          <Printer className="h-4 w-4 mr-2" />
          Print with Lyrics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
