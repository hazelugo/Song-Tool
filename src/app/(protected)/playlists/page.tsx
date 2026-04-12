"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlaylistBuilder, type PlaylistItem } from "@/components/playlist-builder";
import { Button } from "@/components/ui/button";
import type { Song } from "@/db/schema";

interface PlaylistSummary {
  id: string;
  name: string;
  updatedAt: string;
  songCount: number;
}

const PAGE_SIZE = 25;

export default function ViewPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const pageCount = Math.ceil(total / PAGE_SIZE);

  const loadPlaylists = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists?page=${page + 1}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setPlaylists(data.data);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists(pageIndex);
  }, [loadPlaylists, pageIndex]);

  const handleNewPlaylist = async () => {
    setLoadingSongs(true);
    const res = await fetch("/api/songs?limit=1000");
    const data = await res.json();
    setAvailableSongs(Array.isArray(data.data) ? data.data : []);
    setLoadingSongs(false);
    setShowBuilder(true);
  };

  const handleSave = async (name: string, items: PlaylistItem[]) => {
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        items: items.map((item) => ({ song: { id: item.song.id }, rank: item.rank })),
      }),
    });
    if (!res.ok) throw new Error("Failed to save playlist");
    const data = await res.json();
    toast.success(`"${name}" saved`);
    setShowBuilder(false);
    router.push(`/playlists/${data.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete playlist");
    } finally {
      setDeletingId(null);
    }
  };

  if (showBuilder) {
    return (
      <div className="h-screen overflow-hidden">
        <PlaylistBuilder
          availableSongs={availableSongs}
          onSave={handleSave}
          onClose={() => setShowBuilder(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-6xl mx-auto w-full">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">
          Playlists
        </h1>
        <Button
          size="sm"
          onClick={handleNewPlaylist}
          disabled={loadingSongs}
          className="h-10 md:h-7 text-xs rounded-sm"
        >
          {loadingSongs ? "Loading..." : "+ New Playlist"}
        </Button>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground font-mono py-4">Loading...</div>
      ) : playlists.length === 0 && pageIndex === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">No playlists yet</p>
          <Button size="sm" className="rounded-sm" onClick={handleNewPlaylist}>
            Create your first playlist
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group relative flex items-center border border-border/60 border-l-2 border-l-transparent hover:border-l-[color:var(--color-chart-4)] hover:border-[color:var(--color-chart-4)]/30 bg-card rounded-sm transition-all duration-150"
              >
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="flex-1 flex items-center justify-between px-4 py-3 min-w-0"
                >
                  <span className="font-medium text-sm truncate">{playlist.name}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {playlist.songCount} {playlist.songCount !== 1 ? "songs" : "song"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      Last updated {new Date(playlist.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <div className="pr-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === playlist.id}
                    onClick={() => handleDelete(playlist.id, playlist.name)}
                    className="h-9 sm:h-6 px-2 text-xs rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === playlist.id ? "..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 md:h-7 text-xs rounded-sm"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 md:h-7 text-xs rounded-sm"
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
