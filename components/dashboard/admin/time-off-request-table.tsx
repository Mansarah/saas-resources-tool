/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface TimeOffRequest {
  id: string;
  employee: {
    firstName: string | null;
    lastName: string | null;
  };
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
  manager: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  createdAt: Date;
}

interface TimeOffRequestTableProps {
  data: TimeOffRequest[];
}

export const TimeOffRequestTable: React.FC<TimeOffRequestTableProps> = ({ data }) => {
  // ✅ Properly typed states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = [
    {
      id: "S. No.",
      header: "S. No.",
      cell: ({ row }: any) => (
        <div className="text-xs font-medium">{row.index + 1}</div>
      ),
      size: 60,
    },
    {
      accessorKey: "employee",
      id: "Employee",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Employee
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }: any) => (
        <div className="text-sm font-medium">
          {row.original.employee.firstName ?? "-"} {row.original.employee.lastName ?? ""}
        </div>
      ),
    },
    {
      id: "Leave Date",
      header: "Leave Date",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
        </div>
      ),
    },
    {
      accessorKey: "type",
      id: "Type",
      header: "Type",
      cell: ({ row }: any) => (
        <div className="text-sm capitalize">{row.original.type}</div>
      ),
    },
    {
      accessorKey: "status",
      id: "Status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge
          variant={
            row.original.status === "PENDING"
              ? "secondary"
              : row.original.status === "APPROVED"
              ? "default"
              : "destructive"
          }
        >
          {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "manager",
      id: "Approved By",
      header: "Approved By",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.manager
            ? `${row.original.manager.firstName ?? "-"} ${row.original.manager.lastName ?? ""}`
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      id: "Created",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Created
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }: any) => (
        <div className="text-sm">{formatDate(row.original.createdAt)}</div>
      ),
    },
    {
      id: "Actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button variant="link" asChild className="text-xs">
          <Link href={`/admin/time-off-requests/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="max-w-full">
      {/* 🔍 Search + Columns Dropdown */}
      <div className="flex items-center justify-between py-1">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search requests..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
          />
        </div>

        <div className="flex flex-col md:flex-row md:ml-auto gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 🧾 Table */}
      <div className="rounded-none border min-h-[31rem] grid grid-cols-1">
        <Table className="flex-1">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-3 bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium"
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {data?.length === 0 ? (
              <TableRow className="h-12">
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                  No time off requests found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-2 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 📄 Pagination */}
      <div className="flex items-center justify-end  space-x-2 py-1">
        <div className="flex-1 text-sm text-muted-foreground">
          Total Requests: {table.getFilteredRowModel().rows.length}
        </div>
        <div className="space-x-2  flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
