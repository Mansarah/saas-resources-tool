/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeOffRequest, TimeOffType, CompanyHoliday } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, InfoIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const getDaysBetween = (startDate: Date, endDate: Date) => {
  const days = [];
  let currentDate = moment(startDate);

  while (currentDate.isSameOrBefore(endDate)) {
    days.push(currentDate.toDate());
    currentDate = currentDate.add(1, 'day');
  }

  return days;
};


const validateForm = (formData: FormValues) => {
  const errors: Record<string, string> = {};

  
  if (!formData.startDate) {
    errors.startDate = "Start date is required";
  }

 
  if (!formData.endDate) {
    errors.endDate = "End date is required";
  } else if (formData.startDate && formData.endDate < formData.startDate) {
    errors.endDate = "End date must be after start date";
  } else if (formData.endDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    errors.endDate = "End date must be today or in the future";
  }

  
  if (!formData.type) {
    errors.type = "Time off type is required";
  }

  return errors;
};

type FormValues = {
  startDate: Date | null;
  endDate: Date | null;
  type: TimeOffType | "";
  reason: string;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  customExcludedDates: Date[];
};

const hasDateOverlap = (
  startDate: Date,
  endDate: Date,
  existingRequests: TimeOffRequest[]
): { overlaps: boolean; conflictingRequest?: TimeOffRequest } => {
  for (const request of existingRequests) {
    const requestStart = new Date(request.startDate);
    const requestEnd = new Date(request.endDate);

    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const requestStartMoment = moment(requestStart);
    const requestEndMoment = moment(requestEnd);

    const startOverlap =
      startMoment.isBetween(requestStartMoment, requestEndMoment, null, '[]') ||
      startMoment.isSame(requestStartMoment, 'day') ||
      startMoment.isSame(requestEndMoment, 'day');

    const endOverlap =
      endMoment.isBetween(requestStartMoment, requestEndMoment, null, '[]') ||
      endMoment.isSame(requestStartMoment, 'day') ||
      endMoment.isSame(requestEndMoment, 'day');

    const encompassesExisting =
      startMoment.isSameOrBefore(requestStartMoment) && endMoment.isSameOrAfter(requestEndMoment);

    if (startOverlap || endOverlap || encompassesExisting) {
      return { overlaps: true, conflictingRequest: request };
    }
  }

  return { overlaps: false };
};

const getRequestTypeColor = (type: TimeOffType) => {
  switch (type) {
    case "VACATION":
      return "bg-blue-100 text-blue-800";
    case "SICK":
      return "bg-red-100 text-red-800";
    case "PERSONAL":
      return "bg-purple-100 text-purple-800";
    case "OTHER":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const bankHolidays = [
  moment().month(0).date(1).toDate(), // New Year's Day
  moment().month(11).date(25).toDate(), // Christmas Day
  moment().month(11).date(26).toDate(), // Boxing Day
];

const calculateWorkingDays = (
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean,
  excludeHolidays: boolean,
  customExcludedDates: Date[],
  companyHolidays: CompanyHoliday[]
): {
  totalDays: number;
  workingDays: number;
  excludedDays: Date[];
} => {
  const daysBetween = getDaysBetween(startDate, endDate);
  const totalDays = daysBetween.length;

  const excludedDays: Date[] = [];

  daysBetween.forEach((day) => {
    if (excludeWeekends && (moment(day).day() === 0 || moment(day).day() === 6)) {
      excludedDays.push(day);
      return;
    }

    if (
      excludeHolidays &&
      bankHolidays.some((holiday) => moment(holiday).isSame(day, 'day'))
    ) {
      excludedDays.push(day);
      return;
    }

    if (
      excludeHolidays &&
      companyHolidays.some((holiday) => moment(holiday.date).isSame(day, 'day'))
    ) {
      excludedDays.push(day);
      return;
    }

    if (customExcludedDates.some((excluded) => moment(excluded).isSame(day, 'day'))) {
      excludedDays.push(day);
      return;
    }
  });

  const workingDays = totalDays - excludedDays.length;

  return { totalDays, workingDays, excludedDays };
};

const TimeOffRequestForm = ({
  existingRequests,
  companyHolidays,
}: {
  existingRequests: TimeOffRequest[];
  companyHolidays: CompanyHoliday[];
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateOverlapError, setDateOverlapError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  
  
  const [formData, setFormData] = useState<FormValues>({
    startDate: null,
    endDate: null,
    type: "",
    reason: "",
    excludeWeekends: true,
    excludeHolidays: true,
    customExcludedDates: [],
  });
  
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const createTimeOffRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/employee/time-off-requests", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create time off request");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
    },
  });

  const startDate = formData.startDate;
  const endDate = formData.endDate;
  const excludeWeekends = formData.excludeWeekends ?? false;
  const excludeHolidays = formData.excludeHolidays ?? false;
  const customExcludedDates = formData.customExcludedDates;

  const { totalDays, workingDays, excludedDays } =
    startDate && endDate
      ? calculateWorkingDays(
          startDate,
          endDate,
          excludeWeekends,
          excludeHolidays,
          customExcludedDates,
          companyHolidays
        )
      : {
          totalDays: 0,
          workingDays: 0,
          excludedDays: [],
        };

  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      const { overlaps, conflictingRequest } = hasDateOverlap(
        startDate,
        endDate,
        existingRequests
      );

      if (overlaps && conflictingRequest) {
        const formattedStart = moment(conflictingRequest.startDate).format("MMM D, YYYY");
        const formattedEnd = moment(conflictingRequest.endDate).format("MMM D, YYYY");
        setDateOverlapError(
          `This request overlaps with your existing ${conflictingRequest.type.toLowerCase()} time off request from ${formattedStart} to ${formattedEnd}.`
        );
      } else {
        setDateOverlapError(null);
      }
    }
  }, [startDate, endDate, existingRequests]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    if (date || dateString === "") {
      handleInputChange(field, date);
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean | string) => {
    handleInputChange(field, checked === true || checked === 'true');
  };

  const addCustomExcludedDate = (date: Date) => {
    const exists = formData.customExcludedDates.some(d => moment(d).isSame(date, 'day'));
    if (!exists) {
      handleInputChange('customExcludedDates', [...formData.customExcludedDates, date]);
    }
  };

  const removeCustomExcludedDate = (index: number) => {
    const newDates = [...formData.customExcludedDates];
    newDates.splice(index, 1);
    handleInputChange('customExcludedDates', newDates);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError("Please fix the form errors");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    const submitData = new FormData();
    submitData.append("startDate", formData.startDate!.toISOString());
    submitData.append("endDate", formData.endDate!.toISOString());
    submitData.append("type", formData.type as string);
    submitData.append("reason", formData.reason || "");
    submitData.append("excludeWeekends", formData.excludeWeekends ? "true" : "false");
    submitData.append("excludeHolidays", formData.excludeHolidays ? "true" : "false");
    submitData.append("workingDays", workingDays.toString());

    if (formData.customExcludedDates.length > 0) {
      submitData.append(
        "customExcludedDates",
        JSON.stringify(
          formData.customExcludedDates.map((date) => date.toISOString())
        )
      );
    }

    try {
      const timeOffRequestData = await createTimeOffRequestMutation.mutateAsync(submitData);
      if (timeOffRequestData) {
        toast.success("Time off request created successfully");
        router.push("/employee/all-request");
      }
    } catch (error) {
      console.error("Error creating time off request:", error);
      setError("An error occurred while creating the request");
      toast.error("An error occurred while creating the request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Time Off Request</h1>
        <p className="text-gray-600 mt-1">
          Submit a new request for manager approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Existing requests */}
        {existingRequests?.length > 0 && (
          <div className="lg:col-span-1">
            <Card className="border shadow-sm h-full">
              <CardContent className="p-4">
                <h2 className="text-md font-semibold mb-3">
                  Your Upcoming Time Off
                </h2>
                <div className="space-y-2">
                  {existingRequests
                    .filter((request) => new Date(request.startDate) >= new Date())
                    .sort(
                      (a, b) =>
                        new Date(a.startDate).getTime() -
                        new Date(b.startDate).getTime()
                    )
                    .map((request) => {
                      return (
                        <div
                          className="p-2 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                          key={request.id}
                        >
                          <div className="flex items-center gap-2">
                            <Badge className={getRequestTypeColor(request.type)}>
                              {request.type.charAt(0) +
                                request.type.slice(1).toLowerCase()}
                            </Badge>
                            <div className="text-sm">
                              {moment(request.startDate).format("MMM D, YYYY")} -{" "}
                              {moment(request.endDate).format("MMM D, YYYY")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.reason && (
                              <div className="text-sm text-gray-500">
                                {request.reason}
                              </div>
                            )}
                            <Badge
                              variant={
                                request.status === "PENDING"
                                  ? "secondary"
                                  : request.status === "APPROVED"
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {request.status.charAt(0) +
                                request.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right column - Form */}
        <div className={existingRequests?.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      value={formData.startDate ? moment(formData.startDate).format("YYYY-MM-DD") : ""}
                      className="h-11 text-base"
                    />
                    {formErrors.startDate && (
                      <span className="text-xs text-destructive mt-1 block">{formErrors.startDate}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      value={formData.endDate ? moment(formData.endDate).format("YYYY-MM-DD") : ""}
                      className="h-11 text-base"
                    />
                    {formErrors.endDate && (
                      <span className="text-xs text-destructive mt-1 block">{formErrors.endDate}</span>
                    )}
                  </div>
                </div>

                {startDate && endDate && startDate > endDate && (
                  <Alert variant="destructive" className="py-3">
                    <AlertDescription>
                      The end date cannot be before the start date
                    </AlertDescription>
                  </Alert>
                )}

                {dateOverlapError && (
                  <Alert variant="destructive" className="py-3">
                    <AlertDescription>{dateOverlapError}</AlertDescription>
                  </Alert>
                )}

                {startDate && endDate && !formErrors.startDate && !formErrors.endDate && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="font-medium text-blue-800 text-lg">Duration Summary</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm">Total days:</div>
                      <div className="font-medium">{totalDays} calendar day{totalDays !== 1 ? "s" : ""}</div>
                      
                      <div className="text-blue-700 text-sm">Working days:</div>
                      <div className="text-blue-700 font-bold">
                        {workingDays} day{workingDays !== 1 ? "s" : ""}
                      </div>
                      
                      {excludedDays?.length > 0 && (
                        <>
                          <div className="text-sm">Excluded days:</div>
                          <div className="font-medium">
                            {excludedDays.length} day{excludedDays.length !== 1 ? "s" : ""}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {excludedDays?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <div className="text-sm font-medium mb-2">Excluded dates:</div>
                        <div className="flex flex-wrap gap-1">
                          {excludedDays?.map((day, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {moment(day).format("MMM D")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Day Exclusion Options</h3>
                    <div className="relative group">
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      <div className="absolute hidden group-hover:block w-64 p-2 bg-black text-white text-xs rounded shadow-lg -top-2 -right-2 z-10">
                        Excluded days will show in your time off date range but
                        will not be deducted from your time off allowance.
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="excludeWeekends"
                        checked={formData.excludeWeekends}
                        onCheckedChange={(checked) => handleCheckboxChange('excludeWeekends', checked)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="excludeWeekends" className="text-sm font-medium">Exclude weekends</Label>
                        <p className="text-xs text-muted-foreground">
                          Saturdays and Sundays wont be deducted from your leave allowance.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="excludeHolidays"
                        checked={formData.excludeHolidays}
                        onCheckedChange={(checked) => handleCheckboxChange('excludeHolidays', checked)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="excludeHolidays" className="text-sm font-medium">Exclude holidays</Label>
                        <p className="text-xs text-muted-foreground">
                          Holiday days wont be deducted from your leave allowance.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Custom Excluded Dates (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Add specific dates that should be excluded from your time off allowance
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.customExcludedDates.map((date, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="gap-1 text-xs py-1 px-2"
                        >
                          {moment(date).format("MMM D")}
                          <Button
                            variant={"ghost"}
                            size="sm"
                            className="h-3 w-3 p-0 ml-1"
                            onClick={() => removeCustomExcludedDate(index)}
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}

                      <Popover
                        open={calendarOpen}
                        onOpenChange={setCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="h-8 text-xs"
                            size="sm"
                          >
                            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                            Add date
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={undefined}
                            onSelect={(date) => {
                              if (date) {
                                addCustomExcludedDate(date);
                              }
                              setCalendarOpen(false);
                            }}
                            disabled={(date) =>
                              startDate && endDate
                                ? moment(date).isBefore(startDate) || moment(date).isAfter(endDate)
                                : false
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Time Off Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value as TimeOffType)}
                    >
                      <SelectTrigger id="type" className="h-11 text-base">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                        <SelectItem value="SICK">Sick leave</SelectItem>
                        <SelectItem value="PERSONAL">Personal Time</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.type && (
                      <span className="text-xs text-destructive mt-1 block">{formErrors.type}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter a reason for your time off request"
                      className="min-h-[100px] text-base"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant={"destructive"} className="py-3">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant={"outline"}
                    onClick={() => router.back()}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !!dateOverlapError}
                    className="px-6 py-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimeOffRequestForm;