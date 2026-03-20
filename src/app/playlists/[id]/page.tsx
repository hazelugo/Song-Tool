import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MonitorPlay } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
    <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
          <div className="flex items-center gap-2 sm:mt-8">
            {playlist.songs.length > 0 && (
              <Link
                href={`/playlists/${id}/live`}
                className={buttonVariants({ size: "sm" }) + " h-10 md:h-7 text-xs rounded-sm"}
              >
                <MonitorPlay className="h-3.5 w-3.5 mr-1.5" />
                Live
              </Link>
            )}
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
          <div className="border border-dashed rounded-sm p-12 text-center text-muted-foreground">
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
  );
}
