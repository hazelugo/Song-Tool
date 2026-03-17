import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { PlaylistEditor } from "@/components/ui/playlist-editor";
import { AddSongsDialog } from "@/components/ui/add-songs-dialog";
import { SuggestionsPanel } from "@/components/ui/suggestions-panel";
import { ExportMenu } from "@/components/ui/export-menu";
import { PlaylistNameEditor } from "@/components/ui/playlist-name-editor";
import { createClient } from "@/lib/supabase/server";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const playlist = await db.query.playlists.findFirst({
    where: and(eq(playlists.id, id), eq(playlists.userId, user.id)),
    with: {
      songs: {
        with: { song: { with: { tags: true } } },
        orderBy: (ps, { asc }) => [asc(ps.position)],
      },
    },
  });

  if (!playlist) notFound();

  const existingSongIds = playlist.songs.map((ps) => ps.song.id);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/playlists"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              All Playlists
            </Link>
            <PlaylistNameEditor playlistId={id} initialName={playlist.name} />
            <p className="text-sm text-muted-foreground">
              {playlist.songs.length} song{playlist.songs.length !== 1 ? "s" : ""}
              {" · "}Last updated {new Date(playlist.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-8">
            <ExportMenu
              playlistName={playlist.name}
              songs={playlist.songs.map((ps) => ({
                name: ps.song.name,
                bpm: ps.song.bpm,
                musicalKey: ps.song.musicalKey,
                keySignature: ps.song.keySignature,
                lyrics: ps.song.lyrics,
                tags: ps.song.tags,
              }))}
            />
            <AddSongsDialog
              playlistId={id}
              existingSongIds={existingSongIds}
            />
          </div>
        </div>

        {/* Song list */}
        {playlist.songs.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <p className="font-medium">This playlist is empty</p>
            <p className="text-sm mt-1">Use &quot;Add Songs&quot; to get started</p>
          </div>
        ) : (
          <PlaylistEditor
            playlistId={id}
            initialSongs={playlist.songs.map((ps) => ({
              song: ps.song,
              position: ps.position,
            }))}
          />
        )}

        {/* Smart Suggestions */}
        <SuggestionsPanel
          playlistId={id}
          existingSongIds={existingSongIds}
        />
      </div>
    </main>
  );
}
