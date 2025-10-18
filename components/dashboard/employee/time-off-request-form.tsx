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
import { CalendarIcon, InfoIcon, XIcon, ArrowLeft, Clock, AlertCircle } from "lucide-react";
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
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SICK":
      return "bg-red-100 text-red-800 border-red-200";
    case "PERSONAL":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "OTHER":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

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

interface TimeOffRequestFormProps {
  existingRequests: TimeOffRequest[];
  companyHolidays: CompanyHoliday[];
  availableDays: number;
}

const TimeOffRequestForm = ({
  existingRequests,
  companyHolidays,
  availableDays,
}: TimeOffRequestFormProps) => {
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

    if (workingDays > availableDays) {
      setError(`You only have ${availableDays} day${availableDays !== 1 ? 's' : ''} available. This request requires ${workingDays} day${workingDays !== 1 ? 's' : ''}.`);
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
    <div className="w-full space-y-3 p-3">
      {/* Header Card */}
      <Card className="border border-purple-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock className="text-blue-600 w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-base font-semibold text-gray-900">New Time Off Request</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Submit a new request for manager approval
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {availableDays} days available
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => router.push("/employee/all-request")}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Left Column - Existing Requests */}
        {existingRequests?.length > 0 && (
          <div className="lg:col-span-1 space-y-3">
            <Card className="border border-purple-200">
              <div className="p-3 border-b border-purple-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Upcoming Time Off</h2>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {existingRequests
                    .filter((request) => new Date(request.startDate) >= new Date())
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((request) => (
                      <div
                        className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        key={request.id}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${getRequestTypeColor(request.type)}`}
                          >
                            {request.type.toLowerCase()}
                          </Badge>
                          <Badge
                            variant={
                              request.status === "PENDING"
                                ? "secondary"
                                : request.status === "APPROVED"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs h-5"
                          >
                            {request.status.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {moment(request.startDate).format("MMM D")} - {moment(request.endDate).format("MMM D, YYYY")}
                        </div>
                        {request.reason && (
                          <p className="text-xs text-gray-500 truncate" title={request.reason}>
                            {request.reason}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Column - Form */}
        <div className={existingRequests?.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="border border-purple-200">
            <CardContent className="p-3">
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Date Range Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs p-2 rounded bg-blue-50 text-blue-700 font-medium">
                    <CalendarIcon className="w-3 h-3" />
                    Date Range
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="startDate" className="text-xs font-medium">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        value={formData.startDate ? moment(formData.startDate).format("YYYY-MM-DD") : ""}
                        className="h-9 text-sm"
                      />
                      {formErrors.startDate && (
                        <span className="text-xs text-red-500 mt-0.5 block">{formErrors.startDate}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-xs font-medium">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        value={formData.endDate ? moment(formData.endDate).format("YYYY-MM-DD") : ""}
                        className="h-9 text-sm"
                      />
                      {formErrors.endDate && (
                        <span className="text-xs text-red-500 mt-0.5 block">{formErrors.endDate}</span>
                      )}
                    </div>
                  </div>

                  {startDate && endDate && startDate > endDate && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        The end date cannot be before the start date
                      </AlertDescription>
                    </Alert>
                  )}

                  {dateOverlapError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {dateOverlapError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Duration Summary */}
                {startDate && endDate && !formErrors.startDate && !formErrors.endDate && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-800">Duration Summary</span>
                      <Badge variant="outline" className="text-xs bg-white">
                        {workingDays} working day{workingDays !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-600">Total calendar days:</div>
                      <div className="font-medium">{totalDays}</div>
                      
                      <div className="text-blue-700">Working days:</div>
                      <div className="font-bold text-blue-800">{workingDays}</div>
                      
                      {excludedDays.length > 0 && (
                        <>
                          <div className="text-gray-600">Excluded days:</div>
                          <div className="font-medium">{excludedDays.length}</div>
                        </>
                      )}
                    </div>
                    
                    {excludedDays.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-100">
                        <div className="text-xs font-medium text-blue-800 mb-1">Excluded dates:</div>
                        <div className="flex flex-wrap gap-1">
                          {excludedDays.map((day, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs border border-blue-200"
                            >
                              {moment(day).format("MMM D")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Exclusion Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs p-2 rounded bg-gray-50 text-gray-700 font-medium">
                    <InfoIcon className="w-3 h-3" />
                    Day Exclusion Options
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="excludeWeekends"
                        checked={formData.excludeWeekends}
                        onCheckedChange={(checked) => handleCheckboxChange('excludeWeekends', checked)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor="excludeWeekends" className="text-xs font-medium">Exclude weekends</Label>
                        <p className="text-xs text-gray-500">
                          Saturdays and Sundays won&apos;t count against your leave balance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="excludeHolidays"
                        checked={formData.excludeHolidays}
                        onCheckedChange={(checked) => handleCheckboxChange('excludeHolidays', checked)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor="excludeHolidays" className="text-xs font-medium">Exclude holidays</Label>
                        <p className="text-xs text-gray-500">
                          Company holidays won&apos;t count against your leave balance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Excluded Dates */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Custom Excluded Dates (optional)</Label>
                    <p className="text-xs text-gray-500">
                      Add specific dates to exclude from your time off allowance
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {formData.customExcludedDates.map((date, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="gap-1 text-xs py-1 px-2"
                        >
                          {moment(date).format("MMM D")}
                          <button
                            type="button"
                            className="h-3 w-3 p-0 ml-0.5 hover:bg-gray-100 rounded"
                            onClick={() => removeCustomExcludedDate(index)}
                          >
                            <XIcon className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}

                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-7 text-xs"
                            size="sm"
                            type="button"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
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

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="type" className="text-xs font-medium">Time Off Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value as TimeOffType)}
                    >
                      <SelectTrigger id="type" className="h-9 text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                        <SelectItem value="SICK">Sick Leave</SelectItem>
                        <SelectItem value="PERSONAL">Personal Time</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.type && (
                      <span className="text-xs text-red-500 mt-0.5 block">{formErrors.type}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="reason" className="text-xs font-medium">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter a reason for your time off request"
                      className="min-h-[80px] text-sm"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !!dateOverlapError}
                    className="flex items-center gap-1 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Submit Request
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/employee/all-request")}
                    className="text-sm"
                  >
                    Cancel
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