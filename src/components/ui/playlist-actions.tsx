"use client";

import * as React from "react";
import { ExportMenu } from "@/components/ui/export-menu";
import { AddSongsDialog } from "@/components/ui/add-songs-dialog";

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

interface PlaylistActionsProps {
  playlistId: string;
  playlistName: string;
  existingSongIds: string[];
  exportSongs: ExportSong[];
  liveLink?: React.ReactNode;
}

export function PlaylistActions({
  playlistId,
  playlistName,
  existingSongIds,
  exportSongs,
  liveLink,
}: PlaylistActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:mt-8">
      {liveLink}
      <ExportMenu
        playlistName={playlistName}
        songs={exportSongs}
      />
      <AddSongsDialog
        playlistId={playlistId}
        existingSongIds={existingSongIds}
      />
    </div>
  );
}
