/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckIcon,
  CopyIcon,
  PlusIcon,
  RefreshCwIcon,
  ArrowUpDown,
  ChevronDown,
  Search,
  Crown,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Code } from "@prisma/client";
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
import moment from "moment";
import Link from "next/link";

interface InvitationCodesProps {
  initialCodes: Code[];
  session:any
}

const InvitationCodes = ({ initialCodes,session }: InvitationCodesProps) => {
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();

  const generateInvitationCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/admin/invitation-codes");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
    },
  });

  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const columns: ColumnDef<Code>[] = [
    {
      accessorKey: "code",
      id: "Code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          Code
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs font-medium">
          {row.getValue("Code")}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "used",
      id: "Status",
      header: "Status",
      cell: ({ row }) => (
        <div className="text-xs font-medium">
          {row.getValue("Status") ? (
            <Badge variant="secondary" className="text-xs">
              Used
            </Badge>
          ) : (
            <Badge className="bg-green-500 text-white text-xs">
              Active
            </Badge>
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "createdAt",
      id: "Created",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          Created
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs font-medium">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const code = row.original;
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(code.code)}
              disabled={code.used}
              className="h-7 w-7 p-0"
            >
              {copied[code.code] ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      },
      size: 60,
    },
  ];

  const table = useReactTable({
    data: codes,
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

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const newCode = await generateInvitationCodeMutation.mutateAsync();
      setCodes((prev) => [newCode, ...prev]);
      toast.success("New code generated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate code");
      setError("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied({ ...copied, [code]: true });
      toast.success("Code copied to clipboard");
    });

    setTimeout(() => {
      setCopied({ ...copied, [code]: false });
    }, 2000);
  };

  return (
    <div className="max-w-full bg-white p-2 rounded-md">
      <div className="flex flex-col space-y-4 ">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-bold text-gray-900">Invitation Codes</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Generate and manage invitation codes for your new employees
          </p>
        </div>

        {error && (
          <Alert variant={"destructive"} className="py-2">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between py-1 ">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search codes..."
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
            
            {/* <Button 
              onClick={handleGenerateCode} 
              disabled={isGenerating}
              size="sm"
              className="h-9"
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlusIcon className="mr-2 h-3 w-3" />
                  Generate Code
                </>
              )}
            </Button> */}
            {/* Replace the Generate Code button with this conditional rendering */}
{codes.length < 5 ? (
  <Button 
    onClick={handleGenerateCode} 
    disabled={isGenerating}
    size="sm"
    className="h-9"
  >
    {isGenerating ? (
      <>
        <RefreshCwIcon className="mr-2 h-3 w-3 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <PlusIcon className="mr-2 h-3 w-3" />
        Generate Code
      </>
    )}
  </Button>
) : (
  session?.user?.stripeCurrentPeriodEnd && 
  moment(session.user.stripeCurrentPeriodEnd).isAfter(moment()) && 
  session?.user?.subscriptionStatus === "ACTIVE" ? (
    <Button 
      onClick={handleGenerateCode} 
      disabled={isGenerating}
      size="sm"
      className="h-9"
    >
      {isGenerating ? (
        <>
          <RefreshCwIcon className="mr-2 h-3 w-3 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <PlusIcon className="mr-2 h-3 w-3" />
          Generate Code
        </>
      )}
    </Button>
  ) : (
    <Link href="/admin/upgrade" >
    <Button 
     
      size="sm"
      className="h-9 bg-amber-500 hover:bg-amber-600 hover:cursor-pointer"
      title="You've reached the free version limit. Upgrade to generate more codes."
    >
      <Crown className="mr-2 h-3 w-3 hover:animate-spin" />
      Upgrade
    </Button>
    </Link>
  )
)}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-none border  grid grid-cols-1">
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
                    No invitation codes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 ">
          <div className="flex-1 text-sm text-muted-foreground">
            Total Codes: {table.getFilteredRowModel().rows.length}
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

        {/* Usage Instructions */}
        <div className="mt-2 p-4 border rounded-lg bg-white">
          <h3 className="text-sm font-semibold mb-2">How to use invitation codes</h3>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600">
            <li>Generate a new invitation code using the button above</li>
            <li>Share the code with your employee</li>
            <li>The employee will enter this code during onboarding</li>
            <li>Once used, the code will be marked as &quot;Used&quot; and cannot be reused</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default InvitationCodes;