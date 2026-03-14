"use client";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
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
}

function SortableHeader({ column, label }: { column: any; label: string }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
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
    meta: { className: "w-40" },
    cell: ({ getValue }) => (
      <span className="block whitespace-normal break-words">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "bpm",
    header: ({ column }) => <SortableHeader column={column} label="BPM" />,
    meta: { className: "w-16" },
  },
  {
    accessorKey: "musicalKey",
    header: ({ column }) => <SortableHeader column={column} label="Key" />,
    meta: { className: "w-14" },
  },
  {
    accessorKey: "keySignature",
    header: ({ column }) => <SortableHeader column={column} label="Key Sig." />,
    meta: { className: "w-20" },
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue<string>("keySignature")}</span>
    ),
  },
  {
    accessorKey: "timeSignature",
    header: ({ column }) => (
      <SortableHeader column={column} label="Time Sig." />
    ),
    meta: { className: "w-20" },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => {
      const tags = row.getValue<Tag[]>("tags");
      if (!tags || tags.length === 0) return null;
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((t) => (
            <Badge key={t.id} variant="secondary">
              {t.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
];

export function SongTable({ data, onRowClick, isLoading }: SongTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
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
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={(header.column.columnDef.meta as any)?.className}
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
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={(cell.column.columnDef.meta as any)?.className}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls — only shown when there are rows */}
      {data.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} ({data.length} songs)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
