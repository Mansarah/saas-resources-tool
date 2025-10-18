/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { ArrowUpDown, ChevronDown, Edit, Plus, Search, Trash2, Loader2 } from "lucide-react";

const holidayFormSchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  isRecurring: z.boolean().optional(),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

interface CompanyHoliday {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
}

const CompanyHolidaysForm = ({ initialHolidays }: { initialHolidays: CompanyHoliday[] }) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>(initialHolidays);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});

  // Dialog states
  const [selectedHoliday, setSelectedHoliday] = useState<CompanyHoliday | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // Mutations
  const addHolidayMutation = useMutation({
    mutationFn: async (data: { name: string; date: Date; isRecurring: boolean }) => {
      const response = await axios.post("/api/admin/holidays", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; date: Date; isRecurring: boolean }) => {
      const response = await axios.put(`/api/admin/holidays/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/holidays/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });

  // Forms
  const addForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: "",
      isRecurring: false,
    },
  });

  const editForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: "",
      isRecurring: false,
    },
  });

  useEffect(() => {
    async function fetchHoliday() {
      try {
        setHolidays(
          initialHolidays?.map((h: any) => ({
            id: h.id,
            name: h.name,
            date: new Date(h.date),
            isRecurring: h.isRecurring,
          }))
        );
      } catch (error) {
        console.error("Error fetching holidays:", error);
        toast.error("Failed to fetch holidays");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHoliday();
  }, [initialHolidays]);

  const formatDateForInput = (date: Date) => {
    return moment(date).format('YYYY-MM-DD');
  };

  const ensureDateObject = (date: Date | string): Date => {
    return typeof date === 'string' ? new Date(date) : date;
  };

  // Handlers
  const handleAddHoliday = async (data: HolidayFormValues) => {
    setIsSubmitting(true);
    try {
      const newHoliday = await addHolidayMutation.mutateAsync({
        name: data.name,
        date: new Date(data.date),
        isRecurring: data.isRecurring || false,
      });

      setHolidays([...holidays, {
        ...newHoliday,
        date: new Date(newHoliday.date)
      }]);
      
      addForm.reset();
      setIsAddDialogOpen(false);
      toast.success("Holiday added successfully");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to add holiday");
      toast.error("Failed to add holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHoliday = async (data: HolidayFormValues) => {
    if (!selectedHoliday) return;
    setIsSubmitting(true);

    try {
      const updatedHoliday = await updateHolidayMutation.mutateAsync({
        id: selectedHoliday.id,
        name: data.name,
        date: new Date(data.date),
        isRecurring: data.isRecurring || false,
      });

      setHolidays(
        holidays.map((h) =>
          h.id === selectedHoliday.id
            ? { ...updatedHoliday, date: new Date(updatedHoliday.date) }
            : h
        )
      );

      setIsEditDialogOpen(false);
      toast.success("Holiday updated successfully");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update holiday");
      toast.error("Failed to update holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return;
    
    setIsSubmitting(true);
    try {
      await deleteHolidayMutation.mutateAsync(selectedHoliday.id);
      setHolidays(holidays.filter(h => h.id !== selectedHoliday.id));
      setIsDeleteDialogOpen(false);
      toast.success("Holiday deleted successfully");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete holiday");
      toast.error("Failed to delete holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepareEditDialog = (holiday: CompanyHoliday) => {
    setSelectedHoliday(holiday);
    editForm.reset({
      name: holiday.name,
      date: formatDateForInput(holiday.date),
      isRecurring: holiday.isRecurring,
    });
    setIsEditDialogOpen(true);
  };

  const prepareDeleteDialog = (holiday: CompanyHoliday) => {
    setSelectedHoliday(holiday);
    setIsDeleteDialogOpen(true);
  };

  // Filter holidays based on search
  const filteredHolidays = holidays.filter(holiday =>
    holiday.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
    moment(holiday.date).format("MMMM D, YYYY").toLowerCase().includes(globalFilter.toLowerCase())
  );

  // Table columns configuration
  const columns = [
    {
      id: "name",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {}}
          className="px-2 h-8 text-xs font-medium"
        >
          Holiday Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }: any) => (
        <div className="text-[13px] font-medium">{row.original.name}</div>
      ),
    },
    {
      id: "date",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {}}
          className="px-2 h-8 text-xs font-medium"
        >
          Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }: any) => (
        <div className="text-[13px]">
          {moment(ensureDateObject(row.original.date)).format("MMMM D, YYYY")}
        </div>
      ),
    },
    {
      id: "recurring",
      header: "Recurring",
      cell: ({ row }: any) => (
        row.original.isRecurring ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Yes
          </Badge>
        ) : (
          <div className="text-[13px] text-gray-500">No</div>
        )
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => prepareEditDialog(row.original)}
                  className="h-8 w-8"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Holiday</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => prepareDeleteDialog(row.original)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Holiday</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  const TableShimmer = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {columns.map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="max-w-full bg-white p-2 rounded-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Company Holidays</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your company-wide holidays and time off calendar.
          </p>
        </div>
       
        
      
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search holidays..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 text-sm"
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
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="text-xs capitalize"
                checked={true}
                onCheckedChange={() => {}}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2 h-9">
              <Plus className="h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Company Holiday</DialogTitle>
              <DialogDescription>
                Add a company-wide holiday to your calendar.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddHoliday)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Christmas Day" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Recurring yearly holiday</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Holiday"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Holidays Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id} className="h-10 px-4">
                        {typeof column.header === 'function' ? column.header({} as any) : column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableShimmer />
                </TableBody>
              </Table>
            </div>
          ) : error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 mb-4">No company holidays found.</div>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                Add your first holiday
              </Button>
            </div>
          ) : (
      <div className="rounded-none border  grid  grid-cols-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id}   className="h-10 px-3 bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium">
                        {typeof column.header === 'function' ? column.header({} as any) : column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays
                    .sort((a, b) => ensureDateObject(a.date).getTime() - ensureDateObject(b.date).getTime())
                    .map((holiday, index) => (
                      <TableRow key={holiday.id} className="h-11 hover:bg-gray-50">
                        <TableCell className="px-4 py-2">
                          <div className="text-[13px] font-medium">{holiday.name}</div>
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <div className="text-[13px]">
                            {moment(ensureDateObject(holiday.date)).format("MMMM D, YYYY")}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          {holiday.isRecurring ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Yes
                            </Badge>
                          ) : (
                            <div className="text-[13px] text-gray-500">No</div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <div className="flex space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => prepareEditDialog(holiday)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Holiday</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => prepareDeleteDialog(holiday)}
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Holiday</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Company Holidays</CardTitle>
          <CardDescription>
            How company holidays work in the time off system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>Company holidays are excluded from time off calculations</strong> - 
              When employees request time off that includes company holidays, these days wont count against their leave balance.
            </li>
            <li>
              <strong>Recurring holidays</strong> - Holidays marked as recurring will automatically be observed on the same month and day each year.
            </li>
            <li>
              <strong>Holiday visibility</strong> - All employees will see company holidays when requesting time off.
            </li>
            <li>
              <strong>Holiday management</strong> - Only administrators can add, edit, or delete company holidays.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company Holiday</DialogTitle>
            <DialogDescription>
              Update the details of this holiday.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditHoliday)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring yearly holiday</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Holiday"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </AlertDialogDescription>
            {selectedHoliday && (
              <div className="py-2">
                <p className="font-medium">{selectedHoliday.name}</p>
                <p className="text-gray-500 text-sm">
                  {moment(ensureDateObject(selectedHoliday.date)).format("MMMM D, YYYY")}
                </p>
                {selectedHoliday.isRecurring && (
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200 text-xs">
                    Yearly Holiday
                  </Badge>
                )}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Holiday"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyHolidaysForm;