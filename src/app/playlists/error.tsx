"use client";

import { PageError } from "@/components/page-error";

export default function PlaylistsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} context="Playlists" />;
}
