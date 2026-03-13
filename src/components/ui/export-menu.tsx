"use client";

import { Download } from "lucide-react";
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
  bpm: number | null;
  musicalKey: string | null;
  keySignature: string | null;
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
    const headers = ["Name", "BPM", "Key", "Key Signature", "Tags"];
    const rows = songs.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.bpm ?? "",
      s.musicalKey ?? "",
      s.keySignature ?? "",
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
        bpm: s.bpm,
        musicalKey: s.musicalKey,
        keySignature: s.keySignature,
        tags: (s.tags ?? []).map((t) => t.name),
      })),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `${toSafeFilename(playlistName)}.json`,
      "application/json",
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCsv}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleJson}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
