"use client";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Youtube, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { SongWithTags, Tag } from "@/db/schema";

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") videoId = u.pathname.slice(1).split("?")[0];
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch { return null; }
}

function getSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const embedPath = u.pathname.replace(/^\/(track|album|playlist|episode)/, "/embed/$1");
    return `https://open.spotify.com${embedPath}?utm_source=generator&theme=0`;
  } catch { return null; }
}

interface SongTableProps {
  data: SongWithTags[];
  onRowClick: (song: SongWithTags) => void;
  isLoading: boolean;
  // Server-side pagination — omit to use client-side pagination
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  // Server-side sorting — omit to use client-side sorting
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
}

function SortableHeader({ column, label }: { column: any; label: string }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors text-xs uppercase tracking-widest font-medium text-muted-foreground"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3" />}
      {column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3" />}
      {!column.getIsSorted() && <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

function buildColumns(
  onEmbed: (song: SongWithTags, type: "youtube" | "spotify") => void,
): ColumnDef<SongWithTags>[] {
  return [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    // No fixed width — expands to fill available space alongside Tags
    cell: ({ row }) => {
      const song = row.original;
      const youtubeEmbed = getYoutubeEmbedUrl(song.youtubeUrl ?? "");
      const spotifyEmbed = getSpotifyEmbedUrl(song.spotifyUrl ?? "");
      return (
        <div className="flex items-center gap-1.5">
          <span className="whitespace-normal break-words text-sm font-medium">
            {song.name}
          </span>
          {(youtubeEmbed || spotifyEmbed) && (
            <div className="flex gap-1 shrink-0">
              {youtubeEmbed && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEmbed(song, "youtube"); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Watch on YouTube"
                >
                  <Youtube className="size-3.5" />
                </button>
              )}
              {spotifyEmbed && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEmbed(song, "spotify"); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Play on Spotify"
                >
                  <Music2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "artist",
    header: () => (
      <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground">Artist</span>
    ),
    enableSorting: false,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? <span className="text-sm text-muted-foreground">{v}</span> : null;
    },
  },
  {
    accessorKey: "bpm",
    header: ({ column }) => <SortableHeader column={column} label="BPM" />,
    meta: { className: "w-16" },
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return v != null ? (
        <span className="font-mono tabular-nums text-sm font-semibold">{v}</span>
      ) : null;
    },
  },
  {
    accessorKey: "musicalKey",
    header: ({ column }) => <SortableHeader column={column} label="Key" />,
    meta: { className: "w-14" },
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? (
        <span className="font-mono tabular-nums text-sm font-semibold">{v}</span>
      ) : null;
    },
  },
  {
    accessorKey: "keySignature",
    header: ({ column }) => <SortableHeader column={column} label="Key Sig." />,
    // Hidden on mobile to keep table within screen width
    meta: { className: "w-24 hidden md:table-cell" },
    cell: ({ row }) => (
      <span className="font-mono text-sm capitalize">{row.getValue<string>("keySignature")}</span>
    ),
  },
  {
    accessorKey: "timeSignature",
    header: ({ column }) => (
      <SortableHeader column={column} label="Time Sig." />
    ),
    // Hidden on mobile to keep table within screen width
    meta: { className: "w-24 hidden md:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v ? (
        <span className="font-mono tabular-nums text-sm font-semibold">{v}</span>
      ) : null;
    },
  },
  {
    accessorKey: "tags",
    header: () => (
      <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground">Tags</span>
    ),
    enableSorting: false,
    // No fixed width — expands to fill available space alongside Name
    cell: ({ row }) => {
      const tags = row.getValue<Tag[]>("tags");
      if (!tags || tags.length === 0) return null;
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((t) => (
            <Badge key={t.id} variant="secondary" className="text-xs rounded-sm px-1.5 py-0 h-5">
              {t.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  ]; // end return
} // end buildColumns

export function SongTable({
  data,
  onRowClick,
  isLoading,
  pageCount,
  pageIndex,
  onPageChange,
  sorting: sortingProp,
  onSortingChange,
}: SongTableProps) {
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [embedSong, setEmbedSong] = useState<SongWithTags | null>(null);
  const [embedType, setEmbedType] = useState<"youtube" | "spotify" | null>(null);

  const isManual = pageCount !== undefined && pageIndex !== undefined && onPageChange !== undefined;
  const isManualSort = sortingProp !== undefined && onSortingChange !== undefined;

  const sorting = isManualSort ? sortingProp : localSorting;
  const setSorting: OnChangeFn<SortingState> = isManualSort
    ? (updaterOrValue) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(sorting!)
            : updaterOrValue;
        onSortingChange!(next);
      }
    : setLocalSorting;

  const columns = buildColumns((song, type) => {
    setEmbedSong(song);
    setEmbedType(type);
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      ...(isManual ? { pagination: { pageIndex, pageSize: 25 } } : {}),
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(isManualSort ? { manualSorting: true } : { getSortedRowModel: getSortedRowModel() }),
    ...(isManual
      ? { manualPagination: true, pageCount, onPaginationChange: (updater) => {
          const next = typeof updater === "function" ? updater({ pageIndex, pageSize: 25 }) : updater;
          onPageChange(next.pageIndex);
        }}
      : { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 25 } } }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="border-b border-border/60 hover:bg-transparent">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`py-2 h-8 ${(header.column.columnDef.meta as any)?.className ?? ""}`}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer border-b border-border/40 hover:bg-muted/40 hover:border-l-2 hover:border-l-[color:var(--color-chart-4)] transition-colors h-9 group"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={`py-1.5 ${(cell.column.columnDef.meta as any)?.className ?? ""}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls — only shown when there are multiple pages */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-10 md:h-7 text-xs rounded-sm"
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-10 md:h-7 text-xs rounded-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* YouTube embed dialog */}
      <Dialog
        open={embedType === "youtube" && !!embedSong}
        onOpenChange={(open) => { if (!open) { setEmbedSong(null); setEmbedType(null); } }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="aspect-video w-full">
            {embedSong?.youtubeUrl && (
              <iframe
                src={getYoutubeEmbedUrl(embedSong.youtubeUrl) ?? ""}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Spotify embed dialog */}
      <Dialog
        open={embedType === "spotify" && !!embedSong}
        onOpenChange={(open) => { if (!open) { setEmbedSong(null); setEmbedType(null); } }}
      >
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {embedSong?.spotifyUrl && (
            <iframe
              src={getSpotifyEmbedUrl(embedSong.spotifyUrl) ?? ""}
              height="152"
              className="w-full"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
