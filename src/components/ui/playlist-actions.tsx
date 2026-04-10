"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestionsPanel } from "@/components/ui/suggestions-panel";
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
  hasSongs: boolean;
  liveLink?: React.ReactNode;
}

export function PlaylistActions({
  playlistId,
  playlistName,
  existingSongIds,
  exportSongs,
  hasSongs,
  liveLink,
}: PlaylistActionsProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2 sm:mt-8">
        {liveLink}
        {hasSongs && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSuggestions((v) => !v)}
            className="h-10 md:h-7 text-xs rounded-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Suggest songs
          </Button>
        )}
        <ExportMenu
          playlistName={playlistName}
          songs={exportSongs}
        />
        <AddSongsDialog
          playlistId={playlistId}
          existingSongIds={existingSongIds}
        />
      </div>

      {showSuggestions && (
        <div className="mt-6">
          <SuggestionsPanel
            playlistId={playlistId}
            existingSongIds={existingSongIds}
            open={showSuggestions}
            onOpenChange={setShowSuggestions}
          />
        </div>
      )}
    </>
  );
}
