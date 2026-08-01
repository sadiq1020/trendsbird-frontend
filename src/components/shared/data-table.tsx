"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount?: number;
  totalPages?: number;
  isLoading?: boolean;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  actionButton?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount = 0,
  totalPages = 1,
  isLoading = false,
  searchPlaceholder = "Search records...",
  actionButton,
}: DataTableProps<TData, TValue>) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));

  const [searchInput, setSearchInput] = useState(search);

  // Sync internal search input with URL search state
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce search input to URL query state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput || null);
        setPage(1); // Reset to page 1 on new search
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch, setPage]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
  });

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch(null);
    setPage(1);
  };

  const startItem = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-4">
      {/* Top Bar: Search & Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-8 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {actionButton && <div className="flex items-center gap-2">{actionButton}</div>}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-950/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-400 font-semibold text-xs uppercase tracking-wider h-11"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: limit > 5 ? 5 : limit }).map((_, idx) => (
                <TableRow key={idx} className="border-slate-800/60">
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx} className="py-3">
                      <Skeleton className="h-5 w-full bg-slate-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm text-slate-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <EmptyState
                    title="No records found"
                    description={
                      search
                        ? `No results matching "${search}". Try clearing your search.`
                        : "There are no entries available to display."
                    }
                    action={
                      search ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearSearch}
                          className="border-slate-800 bg-slate-900 text-slate-300"
                        >
                          Clear Search
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-sm text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Showing <span className="font-semibold text-slate-200">{startItem}</span> to{" "}
            <span className="font-semibold text-slate-200">{endItem}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalCount}</span> entries
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Per page:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page <= 1 || isLoading}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs px-2 text-slate-400">
            Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
            <span className="font-semibold text-slate-200">{Math.max(totalPages, 1)}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
