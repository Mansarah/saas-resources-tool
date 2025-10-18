"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
import AllowanceForm from "@/components/dashboard/admin/allowance-form";

interface Employee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  department: string | null;
  availableDays: number | null;
}

interface AllowanceTableProps {
  employees: Employee[];
}

const EmployeeTable = ({ employees }: AllowanceTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      id: "Name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: "email",
      id: "Email",
      header: "Email",
      cell: ({ row }) => <div className="text-xs font-medium">{row.getValue("Email")}</div>,
      size: 200,
    },
    {
      accessorKey: "department",
      id: "Department",
      header: "Department",
      cell: ({ row }) => (
        <div className="text-xs font-medium">
          {row.getValue("Department") || "N/A"}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "role",
      id: "Role",
      header: "Role",
      cell: ({ row }) => (
        <div className="text-xs font-medium">
          {row.getValue("Role")}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "availableDays",
      id: "Available Days",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          Available Days
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs font-medium">
          {row.getValue("Available Days") || 0}
        </div>
      ),
      size: 120,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex flex-row">
            <AllowanceForm
              employeeId={row.original.id}
              employeeName={`${row.original.firstName} ${row.original.lastName}`}
             currentAllowance={row.original.availableDays || 0}
            />
          </div>
        );
      },
      size: 120,
    },
  ];

  const table = useReactTable({
    data: employees,
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
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between py-1">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search employees..."
            value={table.getState().globalFilter || ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
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

      {/* Table */}
      <div className="rounded-none border min-h-[25rem] flex flex-col">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-2 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="h-12">
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-1">
        <div className="flex-1 text-sm text-muted-foreground">
          Total Employees: {table.getFilteredRowModel().rows.length}
        </div>
        <div className="space-x-2">
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
    </div>
  );
};

export default EmployeeTable;