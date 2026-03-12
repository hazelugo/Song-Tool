"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Song } from "@/db/schema";

interface PlaylistItem {
  id: string;
  rank: number;
  song: Song;
}

interface PlaylistDetail {
  id: string;
  name: string;
  items: PlaylistItem[];
}

export default function PlaylistViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/playlists?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load playlist");
        return res.json();
      })
      .then((data) => {
        setPlaylist(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    try {
      const res = await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/playlists");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error || !playlist)
    return (
      <div className="p-8 text-center text-destructive">
        Error: {error || "Playlist not found"}
      </div>
    );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/playlists">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{playlist.name}</h1>
        <Link href={`/playlists/create?id=${id}`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" /> Edit
          </Button>
        </Link>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>BPM</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Key Sig</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlist.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No songs in this playlist.
                </TableCell>
              </TableRow>
            ) : (
              playlist.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-muted-foreground text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.song.name}
                  </TableCell>
                  <TableCell>{item.song.bpm}</TableCell>
                  <TableCell>{item.song.musicalKey}</TableCell>
                  <TableCell className="capitalize">
                    {item.song.keySignature}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
