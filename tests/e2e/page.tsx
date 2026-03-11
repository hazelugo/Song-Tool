"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PlaylistBuilder,
  Song,
  PlaylistItem,
} from "@/components/playlist-builder";

// In a real app, you'd fetch this from your database
const MOCK_LIBRARY: Song[] = [
  { id: "1", title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55" },
  { id: "2", title: "Imagine", artist: "John Lennon", duration: "3:01" },
  { id: "3", title: "Hotel California", artist: "Eagles", duration: "6:30" },
  {
    id: "4",
    title: "Billie Jean",
    artist: "Michael Jackson",
    duration: "4:54",
  },
  {
    id: "5",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    duration: "5:01",
  },
];

export default function CreatePlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(!!playlistId);
  const [initialData, setInitialData] = useState<{
    name: string;
    items: PlaylistItem[];
  } | null>(null);

  useEffect(() => {
    if (playlistId) {
      fetch(`/api/playlists?id=${playlistId}`)
        .then((res) => res.json())
        .then((data) => {
          setInitialData({ name: data.name, items: data.items });
          setIsLoading(false);
        });
    }
  }, [playlistId]);

  async function savePlaylist(name: string, items: PlaylistItem[]) {
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Include ID if we are updating (PUT not implemented yet, using POST as create-new for now)
        body: JSON.stringify({ name, items, id: playlistId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }

      // Optional: Redirect to the playlist list or show success toast
      router.push("/playlists");
    } catch (error) {
      console.error(error);
      throw error; // Re-throw so the builder component can handle the error state
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading playlist...</div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <PlaylistBuilder
        key={playlistId || "new"} // Force remount when ID changes
        availableSongs={MOCK_LIBRARY}
        onSave={savePlaylist}
        // @ts-ignore - Assuming you update PlaylistBuilder to accept these props
        initialName={initialData?.name}
        initialItems={initialData?.items}
      />
    </main>
  );
}
