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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SongWithTags, Tag } from "@/db/schema";

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

const columns: ColumnDef<SongWithTags>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    // No fixed width — expands to fill available space alongside Tags
    cell: ({ getValue }) => (
      <span className="block whitespace-normal break-words text-sm font-medium">
        {getValue<string>()}
      </span>
    ),
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
];

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
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 text-xs rounded-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 text-xs rounded-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
