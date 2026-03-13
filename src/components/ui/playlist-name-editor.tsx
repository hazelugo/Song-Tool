"use client";

import * as React from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlaylistNameEditorProps {
  playlistId: string;
  initialName: string;
}

export function PlaylistNameEditor({
  playlistId,
  initialName,
}: PlaylistNameEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim() || name === initialName) {
      setEditing(false);
      setName(initialName);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditing(false);
    } catch {
      setName(initialName);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setName(initialName);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-2xl font-bold h-auto py-1 px-2"
          autoFocus
          disabled={saving}
        />
        <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setName(initialName);
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-3xl font-bold">{name}</h1>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
