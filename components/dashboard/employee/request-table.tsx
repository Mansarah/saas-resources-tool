"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TimeOffRequest, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SquarePlus,
  ArrowUpDown,
} from "lucide-react";

interface RequestTableProps {
  requests: (TimeOffRequest & {
    manager: User | null;
  })[];
  user: User;
}

type ColumnVisibility = {
  dates?: boolean;
  type?: boolean;
  status?: boolean;
  manager?: boolean;
  created?: boolean;
  reason?: boolean;
  workingDays?: boolean;
};

const RequestTable = ({ requests }: RequestTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort data
  const filteredRequests = requests.filter(request => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      request.type.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower) ||
      (request.manager?.firstName?.toLowerCase().includes(searchLower)) ||
      (request.manager?.lastName?.toLowerCase().includes(searchLower)) ||
      request.reason?.toLowerCase().includes(searchLower) ||
      formatDate(request.startDate).toLowerCase().includes(searchLower) ||
      formatDate(request.endDate).toLowerCase().includes(searchLower)
    );
  });

  // Sort data
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue: string | number | Date | null = a[key as keyof TimeOffRequest];
    let bValue: string | number | Date | null = b[key as keyof TimeOffRequest];
    
    // Navigate nested properties
    if (key === 'manager') {
      aValue = a.manager ? `${a.manager.firstName} ${a.manager.lastName}` : '';
      bValue = b.manager ? `${b.manager.firstName} ${b.manager.lastName}` : '';
    }

    // Handle date comparison
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime();
      bValue = bValue.getTime();
    }

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = sortedRequests.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { id: "dates", header: "Dates", size: 180 },
    { id: "type", header: "Type", size: 120 },
    { id: "status", header: "Status", size: 120 },
    { id: "manager", header: "Manager", size: 140 },
    { id: "created", header: "Created", size: 120 },
    { id: "reason", header: "Reason", size: 200 },
    { id: "workingDays", header: "Days", size: 80 },
  ] as const;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generatePageButtons = () => {
    const buttons = [];
    const totalPageButtons = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(totalPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + totalPageButtons - 1);
    
    if (endPage - startPage + 1 < totalPageButtons) {
      startPage = Math.max(1, endPage - totalPageButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <Button
          key={1}
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          className="h-8 w-8 p-0 text-xs"
        >
          1
        </Button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-2 text-xs">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="h-8 w-8 p-0 text-xs"
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="px-2 text-xs">...</span>);
      }
      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          className="h-8 w-8 p-0 text-xs"
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="w-full space-y-3 p-3">
      {/* Header Card */}
      <Card className="border border-purple-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <SquarePlus className="text-blue-600 w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-base font-semibold text-gray-900">My Time Off Requests</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View and manage your time off requests
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {requests.length} total request{requests.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Button asChild size="sm" className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0">
            <Link href="/employee/new-request">
              <SquarePlus className="w-3 h-3" />
              New Request
            </Link>
          </Button>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="text-xs capitalize"
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(value) => 
                    setColumnVisibility(prev => ({ ...prev, [column.id]: value }))
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-none border border-gray-200 min-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                columnVisibility[column.id] !== false && (
                  <TableHead 
                    key={column.id}
                    className="h-10 px-3 bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium"
                    style={{ width: column.size }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                      className="px-2 h-8 text-xs text-[var(--label-color)] hover:text-[var(--label-color)] hover:bg-transparent"
                    >
                      {column.header}
                      {getSortIcon(column.id)}
                    </Button>
                  </TableHead>
                )
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {paginatedRequests.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center text-sm text-gray-500"
                >
                  {requests.length === 0 
                    ? "You don't have any time off requests yet."
                    : "No requests match your search."
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="h-2 hover:bg-gray-50"
                >
                  {columnVisibility.dates !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs font-medium">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </div>
                    </TableCell>
                  )}
                  
                  {columnVisibility.type !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs capitalize">{request.type.toLowerCase()}</div>
                    </TableCell>
                  )}
                  
                  {columnVisibility.status !== false && (
                    <TableCell className="px-3 py-2">
                      <Badge 
                        variant={getStatusVariant(request.status)}
                        className={`text-xs capitalize border ${getStatusColor(request.status)}`}
                      >
                        {request.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {columnVisibility.manager !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs">
                        {request.manager 
                          ? `${request.manager.firstName} ${request.manager.lastName}`
                          : "N/A"
                        }
                      </div>
                    </TableCell>
                  )}
                  
                  {columnVisibility.created !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs">{formatDate(request.createdAt)}</div>
                    </TableCell>
                  )}
                  
                  {columnVisibility.reason !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs text-gray-600">
                        {request.reason || "No reason provided"}
                      </div>
                    </TableCell>
                  )}
                  
                  {columnVisibility.workingDays !== false && (
                    <TableCell className="px-3 py-2">
                      <div className="text-xs font-medium text-center">
                        {request.workingDaysCount}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-1">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedRequests.length)} of{" "}
            {sortedRequests.length} request{sortedRequests.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {generatePageButtons()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestTable;