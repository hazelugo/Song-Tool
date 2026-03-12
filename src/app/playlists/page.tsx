"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface PlaylistSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export default function ViewPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => {
        setPlaylists(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to load playlists", err));
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this playlist? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete playlist", err);
      alert("Failed to delete playlist");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Playlists</h1>
          <Link
            href="/playlists/create"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Playlist
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group relative block bg-white rounded-lg border hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <Link href={`/playlists/${playlist.id}`} className="block p-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {playlist.name}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(playlist.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(playlist.id)}
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded border border-dashed">
                No playlists found. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
