import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { LiveMode } from "@/components/ui/live-mode";

export default async function LiveModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  if (playlist.songs.length === 0) redirect(`/playlists/${id}`);

  return (
    <LiveMode
      playlistName={playlist.name}
      songs={playlist.songs.map((ps) => ps.song)}
      backHref={`/playlists/${id}`}
    />
  );
}
