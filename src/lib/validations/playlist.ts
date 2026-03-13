import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  songs: z.array(z.string().uuid()).optional().default([]),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
