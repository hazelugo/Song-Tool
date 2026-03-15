"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlaylistBuilder, type PlaylistItem } from "@/components/playlist-builder";
import type { Song } from "@/db/schema";

interface PlaylistSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export default function ViewPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => {
        setPlaylists(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to load playlists", err));
  }, []);

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
    router.push(`/playlists/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this playlist? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete playlist", err);
      alert("Failed to delete playlist");
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
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Playlists</h1>
          <button
            onClick={handleNewPlaylist}
            disabled={loadingSongs}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loadingSongs ? "Loading..." : "+ New Playlist"}
          </button>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group relative block bg-card rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <Link href={`/playlists/${playlist.id}`} className="block p-6">
                  <h2 className="text-xl font-semibold mb-2">{playlist.name}</h2>
                  <div className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(playlist.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(playlist.id)}
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded border border-dashed">
                No playlists yet. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
