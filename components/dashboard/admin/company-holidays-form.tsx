/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import moment from "moment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

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

const CompanyHolidaysForm = ({
  initialHolidays,
}: {
  initialHolidays: CompanyHoliday[];
}) => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>(initialHolidays);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [selectedHoliday, setSelectedHoliday] = useState<CompanyHoliday | null>(
    null
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();


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

  // Helper function to ensure date is a Date object
  const ensureDateObject = (date: Date | string): Date => {
    return typeof date === 'string' ? new Date(date) : date;
  };


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
          initialHolidays?.map(
            (h: {
              id: string;
              name: string;
              date: string | number | Date;
              isRecurring: boolean;
            }) => ({
              id: h.id,
              name: h.name,
              date: new Date(h.date),
              isRecurring: h.isRecurring,
            })
          )
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

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col space-y-2">
        
          <p className="text-3xl font-bold">Company Holidays</p>
          <p className="text-gray-500">
            Manage your company-wide holidays and time off calendar.
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) addForm.reset();
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Company Holiday</DialogTitle>
              <DialogDescription>
                Add a company-wide holiday to your calendar. Recurring holidays
                will be observed every year.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(handleAddHoliday)}
                className="space-y-4"
              >
                <div className="grid gap-4 py-4">
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
                          <Input
                            {...field}
                            type="date"
                          />
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
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant={"outline"}
                    onClick={() => setIsAddDialogOpen(false)}
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
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <p>Loading company holidays...</p>
            </div>
          ) : error ? (
            <Alert variant={"destructive"}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : holidays?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-gray-500 mb-4">No company holidays found.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Add your first holiday.
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays
                    ?.sort((a, b) => ensureDateObject(a.date).getTime() - ensureDateObject(b.date).getTime())
                    ?.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">
                          {holiday.name}
                        </TableCell>
                        <TableCell>
                          {moment(ensureDateObject(holiday.date)).format("MMMM D, YYYY")}
                        </TableCell>
                        <TableCell>
                          {holiday.isRecurring ? (
                            <Badge
                              variant={"outline"}
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Yes
                            </Badge>
                          ) : (
                            "No"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant={"outline"}
                              size="sm"
                              onClick={() => prepareEditDialog(holiday)}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant={"destructive"}
                              size="sm"
                              onClick={() => prepareDeleteDialog(holiday)}
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company holiday</DialogTitle>
            <DialogDescription>
              Update the details of this holiday.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditHoliday)}
              className="space-y-4"
            >
              <div className="grid gap-4 py-4">
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
                        <Input
                          {...field}
                          type="date"
                        />
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
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={() => setIsEditDialogOpen(false)}
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete company holiday</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this holiday? This action cannot
              be undone.
            </DialogDescription>
            {selectedHoliday && (
              <div className="py-4">
                <p className="font-medium">{selectedHoliday.name}</p>
                <p className="text-gray-500">
                  {moment(ensureDateObject(selectedHoliday.date)).format("MMMM D, YYYY")}
                </p>
                {selectedHoliday.isRecurring && (
                  <Badge
                    variant="outline"
                    className="mt-2 bg-green-50 text-green-700 border-green-200"
                  >
                    Yearly Holiday
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant={"outline"}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHoliday}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>About Company Holidays</CardTitle>
          <CardDescription>
            How company holidays work in the time off system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>
                Company holidays are excluded from time off calculations
              </strong>{" "}
              - When employees requesting time off that includes company holidays,
              these days won&lsquo;t count against their leave balance.
            </li>
            <li>
              <strong>Recurring holidays</strong> - Holidays marked as recurring
              will automatically be observed on the same month and day each
              year.
            </li>
            <li>
              <strong>Holiday visibility</strong> - All employees will see
              company holidays when requesting time off.
            </li>
            <li>
              <strong>Holiday management</strong> - Only administrators can add,
              edit, or delete company holidays.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyHolidaysForm;