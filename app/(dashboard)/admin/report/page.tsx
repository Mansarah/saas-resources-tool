/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, Printer, FileSpreadsheet, Search } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
import moment from "moment";
import axios from "axios";

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
  const containerRef = useRef<HTMLDivElement>(null);
//   const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formValues, setFormValues] = useState({
    employeeId: "ALL",
    fromDate: "",
    toDate: moment().format("YYYY-MM-DD"),
  });
  const [searchParams, setSearchParams] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  // Fetch employees list
  const { data: employeesData } = useQuery({
    queryKey: ["employeesList"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/admin/employees");
        setEmployees(response.data.employees);
        return response.data;
      } catch (error) {
        // toast({
        //   title: "Error",
        //   description: "Failed to fetch employees list",
        //   variant: "destructive",
        // });
        alert("error")
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
        // toast({
        //   title: "Error",
        //   description: "Failed to fetch report data",
        //   variant: "destructive",
        // });
         alert("error")
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

  // Group by month
  const groupByMonth = () => {
    const grouped: { [key: string]: TimeOffRequest[] } = {};
    timeOffRequests.forEach(item => {
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
    timeOffRequests.forEach(item => {
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

  const allTotals = calculateTotals(timeOffRequests);
  const monthlyData = groupByMonth();
  const employeeData = groupByEmployee();

  // Print functionality
  const handlePrintPdf = useReactToPrint({
    content: () => containerRef.current,
    documentTitle: "Admin Leave Report",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        body {
          font-size: 10px;
        }
        table {
          font-size: 11px;
        }
        .print-hide {
          display: none;
        }
      }
    `,
    onBeforeGetContent: () => setPrintLoading(true),
    onAfterPrint: () => setPrintLoading(false),
  });

  // Export to Excel (simplified version)
  const exportToExcel = () => {
    setExcelLoading(true);
    try {
      // Create CSV content
      const headers = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status", "Reason", "Submitted On"];
      const csvContent = [
        headers.join(","),
        ...timeOffRequests.map(item => [
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

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave_report_${moment().format("YYYYMMDD_HHmmss")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    //   toast({
    //     title: "Success",
    //     description: "Report exported successfully",
    //   });
     alert("error")
    } catch (error) {
    //   toast({
    //     title: "Error",
    //     description: "Failed to export report",
    //     variant: "destructive",
    //   });
     alert("error")
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Reports</h1>
      
      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formValues.employeeId}
                onValueChange={(value) => handleInputChange("employeeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Employees</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={formValues.fromDate}
                onChange={(e) => handleInputChange("fromDate", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={formValues.toDate}
                onChange={(e) => handleInputChange("toDate", e.target.value)}
              />
            </div>
            
            <div className="space-y-2 flex items-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchParams && (
        <>
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              disabled={printLoading}
              onClick={handlePrintPdf}
            >
              {printLoading ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Print
            </Button>
            
            <Button
              variant="outline"
              disabled={excelLoading}
              onClick={exportToExcel}
            >
              {excelLoading ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Excel
            </Button>
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="monthwise">Monthwise</TabsTrigger>
              <TabsTrigger value="employeewise">Employeewise</TabsTrigger>
            </TabsList>

            {/* All Requests Tab */}
            <TabsContent value="all">
              <div ref={containerRef}>
                <h2 className="text-2xl font-bold text-center mb-4">Leave Requests Report</h2>
                <p className="text-center text-gray-600 mb-6">
                  {formValues.fromDate && `From: ${moment(formValues.fromDate).format("MMM D, YYYY")}`}
                  {formValues.toDate && ` To: ${moment(formValues.toDate).format("MMM D, YYYY")}`}
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-2">Employee</th>
                        <th className="border border-gray-300 p-2">Department</th>
                        <th className="border border-gray-300 p-2">Type</th>
                        <th className="border border-gray-300 p-2">Start Date</th>
                        <th className="border border-gray-300 p-2">End Date</th>
                        <th className="border border-gray-300 p-2">Days</th>
                        <th className="border border-gray-300 p-2">Status</th>
                        <th className="border border-gray-300 p-2">Reason</th>
                        <th className="border border-gray-300 p-2">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeOffRequests.length > 0 ? (
                        timeOffRequests.map((request) => (
                          <tr key={request.id}>
                            <td className="border border-gray-300 p-2">
                              {request.employee.firstName} {request.employee.lastName}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {request.employee.department || "N/A"}
                            </td>
                            <td className="border border-gray-300 p-2 capitalize">
                              {request.type.toLowerCase()}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {moment(request.startDate).format("MMM D, YYYY")}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {moment(request.endDate).format("MMM D, YYYY")}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {request.workingDaysCount}
                            </td>
                            <td className="border border-gray-300 p-2 capitalize">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {request.status.toLowerCase()}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2">
                              {request.reason || "N/A"}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {moment(request.createdAt).format("MMM D, YYYY")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="border border-gray-300 p-4 text-center">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-200 font-bold">
                      <tr>
                        <td colSpan={5} className="border border-gray-300 p-2 text-right">Total:</td>
                        <td className="border border-gray-300 p-2 text-center">{allTotals.totalDays}</td>
                        <td colSpan={3} className="border border-gray-300 p-2">
                          Approved: {allTotals.approvedCount} | 
                          Pending: {allTotals.pendingCount} | 
                          Rejected: {allTotals.rejectedCount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Monthwise Tab */}
            <TabsContent value="monthwise">
              <div className="space-y-6">
                {Object.keys(monthlyData).length > 0 ? (
                  Object.entries(monthlyData).map(([month, requests]) => {
                    const monthTotals = calculateTotals(requests);
                    return (
                      <div key={month} className="border rounded-lg p-4">
                        <h3 className="text-xl font-semibold mb-4">
                          {moment(`${month}-01`).format("MMMM YYYY")}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-300 p-2">Employee</th>
                                <th className="border border-gray-300 p-2">Type</th>
                                <th className="border border-gray-300 p-2">Start Date</th>
                                <th className="border border-gray-300 p-2">End Date</th>
                                <th className="border border-gray-300 p-2">Days</th>
                                <th className="border border-gray-300 p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {requests.map((request) => (
                                <tr key={request.id}>
                                  <td className="border border-gray-300 p-2">
                                    {request.employee.firstName} {request.employee.lastName}
                                  </td>
                                  <td className="border border-gray-300 p-2 capitalize">
                                    {request.type.toLowerCase()}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {moment(request.startDate).format("MMM D, YYYY")}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {moment(request.endDate).format("MMM D, YYYY")}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {request.workingDaysCount}
                                  </td>
                                  <td className="border border-gray-300 p-2 capitalize">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
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
                            <tfoot className="bg-gray-200 font-bold">
                              <tr>
                                <td colSpan={4} className="border border-gray-300 p-2 text-right">Monthly Total:</td>
                                <td className="border border-gray-300 p-2 text-center">{monthTotals.totalDays}</td>
                                <td className="border border-gray-300 p-2">
                                  A: {monthTotals.approvedCount} | 
                                  P: {monthTotals.pendingCount} | 
                                  R: {monthTotals.rejectedCount}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Employeewise Tab */}
            <TabsContent value="employeewise">
              <div className="space-y-6">
                {Object.keys(employeeData).length > 0 ? (
                  Object.entries(employeeData).map(([employeeId, requests]) => {
                    const employee = requests[0].employee;
                    const employeeTotals = calculateTotals(requests);
                    return (
                      <div key={employeeId} className="border rounded-lg p-4">
                        <h3 className="text-xl font-semibold mb-4">
                          {employee.firstName} {employee.lastName}
                          {employee.department && ` - ${employee.department}`}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-300 p-2">Type</th>
                                <th className="border border-gray-300 p-2">Start Date</th>
                                <th className="border border-gray-300 p-2">End Date</th>
                                <th className="border border-gray-300 p-2">Days</th>
                                <th className="border border-gray-300 p-2">Status</th>
                                <th className="border border-gray-300 p-2">Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {requests.map((request) => (
                                <tr key={request.id}>
                                  <td className="border border-gray-300 p-2 capitalize">
                                    {request.type.toLowerCase()}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {moment(request.startDate).format("MMM D, YYYY")}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {moment(request.endDate).format("MMM D, YYYY")}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {request.workingDaysCount}
                                  </td>
                                  <td className="border border-gray-300 p-2 capitalize">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                      request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                      "bg-red-100 text-red-800"
                                    }`}>
                                      {request.status.toLowerCase()}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    {request.reason || "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-200 font-bold">
                              <tr>
                                <td colSpan={3} className="border border-gray-300 p-2 text-right">Employee Total:</td>
                                <td className="border border-gray-300 p-2 text-center">{employeeTotals.totalDays}</td>
                                <td colSpan={2} className="border border-gray-300 p-2">
                                  A: {employeeTotals.approvedCount} | 
                                  P: {employeeTotals.pendingCount} | 
                                  R: {employeeTotals.rejectedCount}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;