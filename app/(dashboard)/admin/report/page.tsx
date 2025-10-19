/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Printer, FileDown, Search, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import moment from "moment";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
}

interface TimeOffRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: string;
  managerId: string | null;
  manager: {
    firstName: string;
    lastName: string;
  } | null;
  notes: string | null;
  workingDaysCount: number;
  createdAt: string;
  updatedAt: string;
}

const AdminReportsPage = () => {
   const { data: session } = useSession();
  const tableRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formValues, setFormValues] = useState({
    employeeId: "ALL",
    fromDate: "",
    toDate: moment().format("YYYY-MM-DD"),
  });
  const [searchParams, setSearchParams] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Fetch employees list
  const { data: employeesData } = useQuery({
    queryKey: ["employeesList"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/admin/employees");
        setEmployees(response.data.employees);
        return response.data;
      } catch (error) {
        toast.error("Failed to fetch employees list");
        return { employees: [] };
      }
    },
  });

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReport", searchParams],
    queryFn: async () => {
      if (!searchParams) return { data: [] };

      try {
        const response = await axios.post("/api/admin/reports", searchParams);
        return response.data;
      } catch (error) {
        toast.error("Failed to fetch report data");
        return { data: [] };
      }
    },
    enabled: !!searchParams,
  });

  const timeOffRequests: TimeOffRequest[] = reportData?.data || [];

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(formValues);
  };

  // Filter data based on global search
  const filteredRequests = timeOffRequests.filter(request => {
    if (!globalFilter) return true;
    
    const searchTerm = globalFilter.toLowerCase();
    return (
      request.employee.firstName.toLowerCase().includes(searchTerm) ||
      request.employee.lastName.toLowerCase().includes(searchTerm) ||
      request.employee.department?.toLowerCase().includes(searchTerm) ||
      request.type.toLowerCase().includes(searchTerm) ||
      request.status.toLowerCase().includes(searchTerm) ||
      request.reason?.toLowerCase().includes(searchTerm) ||
      moment(request.startDate).format("DD-MM-YYYY").includes(searchTerm) ||
      moment(request.endDate).format("DD-MM-YYYY").includes(searchTerm)
    );
  });

  // Group by month
  const groupByMonth = () => {
    const grouped: { [key: string]: TimeOffRequest[] } = {};
    filteredRequests.forEach(item => {
      const date = new Date(item.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(item);
    });
    return grouped;
  };

  // Group by employee
  const groupByEmployee = () => {
    const grouped: { [key: string]: TimeOffRequest[] } = {};
    filteredRequests.forEach(item => {
      const employeeId = item.employeeId;
      if (!grouped[employeeId]) {
        grouped[employeeId] = [];
      }
      grouped[employeeId].push(item);
    });
    return grouped;
  };

  // Calculate totals
  const calculateTotals = (data: TimeOffRequest[]) => {
    return data.reduce((acc, item) => {
      acc.totalDays += item.workingDaysCount;
      acc.approvedCount += item.status === "APPROVED" ? 1 : 0;
      acc.pendingCount += item.status === "PENDING" ? 1 : 0;
      acc.rejectedCount += item.status === "REJECTED" ? 1 : 0;
      return acc;
    }, { 
      totalDays: 0, 
      approvedCount: 0, 
      pendingCount: 0, 
      rejectedCount: 0 
    });
  };

  const allTotals = calculateTotals(filteredRequests);
  const monthlyData = groupByMonth();
  const employeeData = groupByEmployee();

 

  const exportToExcel = () => {
    setExcelLoading(true);
    try {
      const headers = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status", "Reason", "Submitted On"];
      const csvContent = [
        headers.join(","),
        ...filteredRequests.map(item => [
          `${item.employee.firstName} ${item.employee.lastName}`,
          item.employee.department || "",
          item.type,
          moment(item.startDate).format("YYYY-MM-DD"),
          moment(item.endDate).format("YYYY-MM-DD"),
          item.workingDaysCount,
          item.status,
          item.reason || "",
          moment(item.createdAt).format("YYYY-MM-DD")
        ].map(field => `"${field}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave_report_${moment().format("YYYYMMDD_HHmmss")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="max-w-full p-4">
      <div className="flex flex-col space-y-4">
        {/* Header matching Ledger Report exactly */}
        <Card className="shadow-sm">
          <div className={`sticky top-0 z-10 border border-gray-200 rounded-lg bg-purple-400 shadow-sm p-3 mb-2`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Title Section */}
              <div className="w-[30%] shrink-0">
                <h1 className="text-xl font-bold text-gray-800 truncate">Leave Reports</h1>
                {searchParams && (
                  <p className="text-md text-white truncate">
                    {formValues.employeeId === "ALL" ? "All Employees" : 
                      employees.find(emp => emp.id === formValues.employeeId)?.firstName + " " + 
                      employees.find(emp => emp.id === formValues.employeeId)?.lastName}
                  </p>
                )}
              </div>

              {/* Form Section */}
              <div className="bg-white w-full lg:w-[70%] p-3 rounded-md shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                <form onSubmit={onSubmit} className="flex flex-wrap gap-3 w-full">
  {/* Employee Select */}
  <div className="flex-1 min-w-[150px]">
    <Label htmlFor="employee" className="text-xs text-gray-700">
      Employee
    </Label>
    <Select
      value={formValues.employeeId}
      onValueChange={(value) => handleInputChange("employeeId", value)}
    >
      <SelectTrigger className="h-10 text-xs w-full">
        <SelectValue placeholder="Select Employee" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Employees</SelectItem>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id} className="text-xs">
            {employee.firstName} {employee.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* From Date */}
  <div className="flex-1 min-w-[120px]">
    <Label htmlFor="fromDate" className="text-xs text-gray-700">
      From Date
    </Label>
    <Input
      id="fromDate"
      type="date"
      value={formValues.fromDate}
      onChange={(e) => handleInputChange("fromDate", e.target.value)}
      className="h-10 text-xs w-full"
    />
  </div>

  {/* To Date */}
  <div className="flex-1 min-w-[120px]">
    <Label htmlFor="toDate" className="text-xs text-gray-700">
      To Date
    </Label>
    <Input
      id="toDate"
      type="date"
      value={formValues.toDate}
      onChange={(e) => handleInputChange("toDate", e.target.value)}
      className="h-10 text-xs w-full"
    />
  </div>


   {/* Generate Button */}
<div className="flex-1 min-w-[100px] flex items-end ">
  {session?.user?.subscriptionStatus === "ACTIVE" &&
  !moment().isAfter(moment(session?.user?.stripeCurrentPeriodEnd)) ? (
   
    <Button
      type="submit"
      disabled={isLoading}
      className="h-10 text-xs bg-blue-600 hover:bg-blue-700 text-white w-full  cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          Generating...
        </>
      ) : (
        <>
          <Search className="h-4 w-4 mr-1" />
          Generate
        </>
      )}
    </Button>
  ) : (
   
      <Link href="/admin/upgrade" >
    <Button
      type="button"
  
      className="h-10 text-xs bg-gradient-to-r from-purple-500 to-purple-800 hover:opacity-90 text-white w-full cursor-pointer"
    >
      🔒 Unlock Feature
    </Button>
    </Link>
  )}
</div>


</form>

                </div>
              </div>
            </div>
          </div>

          {/* Action Bar with Search */}
          {searchParams && (
            <CardContent className="p-4">
              <div className="flex items-center justify-between py-1">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search reports..."
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
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
                      <DropdownMenuCheckboxItem className="text-xs" checked>
                        Employee
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked>
                        Department
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked>
                        Type
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked>
                        Dates
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked>
                        Status
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="flex gap-2">
                   

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={excelLoading}
                      onClick={exportToExcel}
                      className="h-9"
                    >
                      {excelLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <FileDown className="h-3 w-3 mr-1" />
                      )}
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {searchParams && (
          <>
            {/* Report Content */}
            <div ref={tableRef} className="w-full bg-white  p-2 rounded-md">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="all" className="text-xs">
                    All Requests ({filteredRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="monthwise" className="text-xs">
                    Monthwise ({Object.keys(monthlyData).length})
                  </TabsTrigger>
                  <TabsTrigger value="employeewise" className="text-xs">
                    Employeewise ({Object.keys(employeeData).length})
                  </TabsTrigger>
                </TabsList>

                {/* All Requests Tab */}
                <TabsContent value="all">
                  <div className="rounded-none border min-h-[31rem] flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Employee</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Department</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Type</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Start Date</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">End Date</th>
                            <th className="h-10 px-3 text-center text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Days</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Status</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Reason</th>
                            <th className="h-10 px-3 text-left text-sm font-medium bg-[var(--team-color)] text-[var(--label-color)]">Submitted On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.length > 0 ? (
                            filteredRequests.map((request, index) => (
                              <tr key={request.id} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm">
                                  {request.employee.firstName} {request.employee.lastName}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {request.employee.department || "N/A"}
                                </td>
                                <td className="px-3 py-2 text-sm capitalize">
                                  {request.type.toLowerCase()}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {moment(request.startDate).format("DD-MMM-YYYY")}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {moment(request.endDate).format("DD-MMM-YYYY")}
                                </td>
                                <td className="px-3 py-2 text-sm text-center">
                                  {request.workingDaysCount}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                    request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {request.status.toLowerCase()}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {request.reason || "N/A"}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {moment(request.createdAt).format("DD-MMM-YYYY")}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-500">
                                No leave requests found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary */}
                  {filteredRequests.length > 0 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                      <div className="flex-1 text-sm text-muted-foreground">
                        Total Requests: {filteredRequests.length}
                      </div>
                      <div className="space-x-4 text-sm">
                        <span className="text-green-600">Approved: {allTotals.approvedCount}</span>
                        <span className="text-yellow-600">Pending: {allTotals.pendingCount}</span>
                        <span className="text-red-600">Rejected: {allTotals.rejectedCount}</span>
                        <span className="font-medium">Total Days: {allTotals.totalDays}</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Monthwise Tab */}
                <TabsContent value="monthwise">
                  <div className="space-y-4">
                    {Object.keys(monthlyData).length > 0 ? (
                      Object.entries(monthlyData).map(([month, requests]) => {
                        const monthTotals = calculateTotals(requests);
                        return (
                          <div key={month} className="rounded-none border min-h-[20rem] flex flex-col">
                            <div className="h-10 px-3 flex items-center bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium">
                              {moment(`${month}-01`).format("MMMM YYYY")} 
                              <span className="ml-2 text-xs font-normal">
                                ({requests.length} requests, {monthTotals.totalDays} days)
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Employee</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Type</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Start Date</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">End Date</th>
                                    <th className="h-10 px-3 text-center text-sm font-medium bg-gray-50">Days</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {requests.map((request) => (
                                    <tr key={request.id} className="border-b hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm">
                                        {request.employee.firstName} {request.employee.lastName}
                                      </td>
                                      <td className="px-3 py-2 text-sm capitalize">
                                        {request.type.toLowerCase()}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        {moment(request.startDate).format("DD-MMM-YYYY")}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        {moment(request.endDate).format("DD-MMM-YYYY")}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center">
                                        {request.workingDaysCount}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                          request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                          "bg-red-100 text-red-800"
                                        }`}>
                                          {request.status.toLowerCase()}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-none border min-h-[20rem] flex items-center justify-center">
                        <div className="text-center text-gray-500 text-sm">
                          No data available for the selected period
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Employeewise Tab */}
                <TabsContent value="employeewise">
                  <div className="space-y-4">
                    {Object.keys(employeeData).length > 0 ? (
                      Object.entries(employeeData).map(([employeeId, requests]) => {
                        const employee = requests[0].employee;
                        const employeeTotals = calculateTotals(requests);
                        return (
                          <div key={employeeId} className="rounded-none border min-h-[20rem] flex flex-col">
                            <div className="h-10 px-3 flex items-center bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium">
                              {employee.firstName} {employee.lastName}
                              {employee.department && ` - ${employee.department}`}
                              <span className="ml-2 text-xs font-normal">
                                ({requests.length} requests, {employeeTotals.totalDays} days)
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Type</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Start Date</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">End Date</th>
                                    <th className="h-10 px-3 text-center text-sm font-medium bg-gray-50">Days</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Status</th>
                                    <th className="h-10 px-3 text-left text-sm font-medium bg-gray-50">Reason</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {requests.map((request) => (
                                    <tr key={request.id} className="border-b hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm capitalize">
                                        {request.type.toLowerCase()}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        {moment(request.startDate).format("DD-MMM-YYYY")}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        {moment(request.endDate).format("DD-MMM-YYYY")}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center">
                                        {request.workingDaysCount}
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                          request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                          "bg-red-100 text-red-800"
                                        }`}>
                                          {request.status.toLowerCase()}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm">
                                        {request.reason || "N/A"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-none border min-h-[20rem] flex items-center justify-center">
                        <div className="text-center text-gray-500 text-sm">
                          No data available for the selected period
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;