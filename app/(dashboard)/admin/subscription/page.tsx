// app/admin/subscription/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Crown, 
  Zap, 
  History, 
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronDown,
  Search,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  stripeCurrentPeriodEnd: string;
  stripeCurrentPeriodStart: string;
  createdAt: string;
  isUpdatedPlan?: string | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  planType: string;
  stripeSessionId?: string;
  isUpdatedPlan?: string | null;
  stripeCurrentPeriodEnd?: string;
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  // Table states with proper types
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionData();
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/subscription'),
        fetch('/api/admin/payment-history')
      ]);

      let subData = null;
      
      if (subResponse.ok) {
        subData = await subResponse.json();
        setSubscription(subData);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        // Add renewal date to payment history based on subscription data
        const paymentHistoryWithRenewal = paymentsData.map((payment: PaymentHistory) => ({
          ...payment,
          stripeCurrentPeriodEnd: subData?.stripeCurrentPeriodEnd || payment.createdAt
        }));
        setPaymentHistory(paymentHistoryWithRenewal);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'SEVEN_DAYS':
        return Zap;
      case 'FOURTEEN_DAYS':
        return Crown;
      case 'ONE_MONTH':
        return Calendar;
      default:
        return Zap;
    }
  };

  const formatPlanName = (planType: string) => {
    return planType.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getPlanAmount = (planType: string) => {
    const prices = {
      'SEVEN_DAYS': 129,
      'FOURTEEN_DAYS': 299,
      'ONE_MONTH': 499
    };
    return prices[planType as keyof typeof prices] || 0;
  };

  const handleUpgrade = () => {
    router.push('/admin/upgrade');
  };

  // Table columns definition with proper types
  const columns: ColumnDef<PaymentHistory>[] = [
    {
      id: "S. No.",
      header: "S. No.",
      cell: ({ row }) => {
        const globalIndex = row.index + 1;
        return <div className="text-xs font-medium">{globalIndex}</div>;
      },
      size: 60,
    },
    {
      accessorKey: "createdAt",
      id: "Created Date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Created Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">
          {new Date(row.getValue("Created Date")).toLocaleDateString()}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "stripeCurrentPeriodEnd",
      id: "Renewal Date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Renewal Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">
          {new Date(row.getValue("Renewal Date")).toLocaleDateString()}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "planType",
      id: "Plan",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Plan
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const planType = row.getValue("Plan") as string;
        const IconComponent = getPlanIcon(planType);
        return (
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <IconComponent className="h-4 w-4 text-indigo-600" />
            {formatPlanName(planType)}
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "amount",
      id: "Amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Amount
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">₹{row.getValue("Amount")}</div>
      ),
      size: 100,
    },
    {
      accessorKey: "status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          variant={getPaymentStatusVariant(row.getValue("Status"))}
          className="text-xs"
        >
          {row.getValue("Status")}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: "isUpdatedPlan",
      id: "Upgrade Info",
      header: "Upgrade Info",
      cell: ({ row }) => {
        const upgradeInfo = row.getValue("Upgrade Info");
        return upgradeInfo ? (
          <div className="max-w-xs">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs border-blue-200">
              Plan Updated
            </Badge>
            <p className="text-xs text-gray-600 mt-1">{upgradeInfo as string}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      },
      size: 200,
    },
  ];

  const table = useReactTable({
    data: paymentHistory || [],
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

  const TableShimmer = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hasUpgradePlan = subscription?.isUpdatedPlan != null;

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-full mx-auto px-2">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-xs text-gray-600">Manage your plans and view payment history</p>
            </div>
            <Button onClick={handleUpgrade} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Current Plan Status - Compact Version */}
        <div className="mb-2">
          <div className={`rounded-lg border p-4 ${
            hasUpgradePlan 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasUpgradePlan ? 'bg-blue-200' : 'bg-indigo-200'
                }`}>
                  {subscription ? (() => {
                    const IconComponent = getPlanIcon(subscription.planType);
                    return <IconComponent className={`h-4 w-4 ${
                      hasUpgradePlan ? 'text-blue-700' : 'text-indigo-700'
                    }`} />;
                  })() : <Clock className="h-4 w-4 text-gray-500" />}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-xs text-gray-600">
                    {subscription ? 'Active subscription' : 'No active subscription'}
                  </p>
                </div>
              </div>
              {subscription && (
                <Badge 
                  className={`text-xs ${
                    hasUpgradePlan 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {subscription.status.toLowerCase()}
                  {hasUpgradePlan && ' • Upgraded'}
                </Badge>
              )}
            </div>
            
            {subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {formatPlanName(subscription.planType)}
                    </h3>
                    <p className="text-sm text-gray-600">₹{getPlanAmount(subscription.planType)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {calculateDaysRemaining(subscription.stripeCurrentPeriodEnd)} days left
                    </p>
                    <p className="text-xs text-gray-600">
                      Renews {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {hasUpgradePlan && (
                  <div className="flex items-start gap-2 text-xs bg-white rounded p-2 border">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                    <span className="text-gray-700">
                      {subscription.isUpdatedPlan}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-gray-600 mb-3 text-sm">No active subscription found</p>
                <Button 
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Choose a Plan
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Table */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <History className="h-4 w-4 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            </div>
            <p className="text-sm text-gray-600">
              Your recent payments and transactions
            </p>
          </div>
          
          <div className="p-2 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search payments..."
                  value={table.getState().globalFilter || ""}
                  onChange={(event) => table.setGlobalFilter(event.target.value)}
                  className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200 w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:ml-auto gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto">
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
          </div>

          {/* Table */}
          <div className="rounded-none border-b min-h-[25rem] grid grid-cols-1">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-[var(--team-color)] hover:bg-[var(--team-color)] ">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="h-10 px-3 text-white text-sm font-medium"
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
                {loading && !table.getRowModel().rows.length ? (
                  <TableShimmer />
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const hasUpgrade = row.original.isUpdatedPlan != null;
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={`h-2 hover:bg-gray-50 ${
                          hasUpgrade ? 'bg-blue-50 hover:bg-blue-100' : ''
                        }`}
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
                    );
                  })
                ) : (
                  <TableRow className="h-12">
                    <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                      No payment history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 space-x-0 sm:space-x-2 py-3 px-4">
            <div className="flex-1 text-sm text-gray-600">
              Total Payments : &nbsp;
              {table.getFilteredRowModel().rows.length}
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
      </div>
    </div>
  );
}