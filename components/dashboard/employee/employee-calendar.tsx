/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimeOffRequest, CompanyHoliday, User } from "@prisma/client";
import moment from "moment";
import Link from "next/link";

interface EmployeeStats {
  totalLeaveTaken: number;
  remainingLeave: number;
  pendingRequests: number;
  approvedRequests: number;
}

interface EmployeeCalendarProps {
  employee: User;
  timeOffRequests: any[];
  companyHolidays: CompanyHoliday[];
  stats: EmployeeStats;
}

const EmployeeCalendar = ({ employee, timeOffRequests, companyHolidays, stats }: EmployeeCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get all events for the current month
  const getEventsForMonth = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Filter time off requests for current month
    const monthTimeOffRequests = timeOffRequests.filter(request => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      return startDate <= lastDayOfMonth && endDate >= firstDayOfMonth;
    });
    
    // Filter holidays for current month
    const monthHolidays = companyHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= firstDayOfMonth && holidayDate <= lastDayOfMonth;
    });
    
    return { monthTimeOffRequests, monthHolidays };
  };

  const { monthTimeOffRequests, monthHolidays } = getEventsForMonth();

  // Check if a date has time off requests
  const getTimeOffRequestsForDate = (date: Date) => {
    return timeOffRequests.filter(request => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  // Check if a date is a company holiday
  const getHolidayForDate = (date: Date) => {
    return companyHolidays.find(holiday => 
      moment(holiday.date).isSame(date, 'day')
    );
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    return moment(date).isSame(new Date(), 'day');
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100' };
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-100' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600 bg-red-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100' };
    }
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 p-1 border"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const timeOffRequestsForDate = getTimeOffRequestsForDate(date);
      const holiday = getHolidayForDate(date);
      const isTodayDate = isToday(date);
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 p-1 border cursor-pointer ${isTodayDate ? 'bg-blue-50' : ''} ${!isCurrentMonth(date) ? 'text-gray-400' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isTodayDate ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
              {day}
            </span>
            {holiday && (
              <Badge variant="destructive" className="text-xs py-0 px-1">Holiday</Badge>
            )}
          </div>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
            {holiday && (
              <div className="text-xs bg-red-100 text-red-800 p-1 rounded">
                {holiday.name}
              </div>
            )}
            
            {timeOffRequestsForDate.map(request => {
              const StatusIcon = getStatusInfo(request.status).icon;
              return (
                <div 
                  key={request.id} 
                  className="text-xs bg-blue-100 text-blue-800 p-1 rounded flex items-center"
                  title={`${request.type} - ${request.status}`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {request.type}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return days;
  };

  // Get events for selected date
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return { timeOffRequests: [], holiday: null };
    
    return {
      timeOffRequests: getTimeOffRequestsForDate(selectedDate),
      holiday: getHolidayForDate(selectedDate)
    };
  };

  const { timeOffRequests: selectedDateRequests, holiday: selectedDateHoliday } = getEventsForSelectedDate();

  // Group time off requests by status
  const approvedRequests = timeOffRequests.filter(req => req.status === 'APPROVED');
  const pendingRequests = timeOffRequests.filter(req => req.status === 'PENDING');
  const rejectedRequests = timeOffRequests.filter(req => req.status === 'REJECTED');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Section - 65% width */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {renderCalendarDays()}
            </div>

            {/* Calendar Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 mr-1"></div>
                <span>Your Time Off</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border border-red-300 mr-1"></div>
                <span>Company Holiday</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                <span>Approved</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-yellow-600 mr-1" />
                <span>Pending</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-3 w-3 text-red-600 mr-1" />
                <span>Rejected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Employee Summary Section - 35% width */}
      <div className="space-y-6">
        {/* Selected Date Details */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {moment(selectedDate).format('MMMM D, YYYY')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateHoliday && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800">Company Holiday</h3>
                  <p className="text-red-700">{selectedDateHoliday.name}</p>
                </div>
              )}
              
              {selectedDateRequests.length > 0 ? (
                <div>
                  <h3 className="font-medium mb-2">Your Time Off</h3>
                  <div className="space-y-2">
                    {selectedDateRequests.map(request => {
                      const StatusIcon = getStatusInfo(request.status).icon;
                      return (
                        <div key={request.id} className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{request.type.toLowerCase()}</p>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <p className="text-sm text-blue-700">
                            {moment(request.startDate).format('MMM D')} - {moment(request.endDate).format('MMM D, YYYY')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Status: {request.status.toLowerCase()}
                          </p>
                          {request.reason && (
                            <p className="text-xs mt-1">Reason: {request.reason}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !selectedDateHoliday && (
                <p className="text-gray-500">No time off scheduled for this date</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Employee Leave Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Leave Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-2xl font-bold text-green-700">{stats.remainingLeave}</p>
                <p className="text-sm text-green-600">Days Remaining</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.totalLeaveTaken}</p>
                <p className="text-sm text-blue-600">Days Taken</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                <p className="text-2xl font-bold text-yellow-700">{stats.pendingRequests}</p>
                <p className="text-sm text-yellow-600">Pending Requests</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
                <p className="text-2xl font-bold text-gray-700">{employee.availableDays}</p>
                <p className="text-sm text-gray-600">Total Allowance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {timeOffRequests.length > 0 ? (
              timeOffRequests.slice(0, 5).map(request => {
                const StatusIcon = getStatusInfo(request.status).icon;
                const statusColor = getStatusInfo(request.status).color;
                
                return (
                  <div key={request.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium capitalize">{request.type.toLowerCase()}</p>
                        <p className="text-sm text-gray-500">
                          {moment(request.startDate).format('MMM D')} - {moment(request.endDate).format('MMM D, YYYY')}
                        </p>
                        <p className="text-xs">{request.workingDaysCount} day(s)</p>
                      </div>
                      <Badge className={statusColor}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {request.status}
                      </Badge>
                    </div>
                    {request.reason && (
                      <p className="text-xs mt-2 text-gray-600">Reason: {request.reason}</p>
                    )}
                    {request.manager && (
                      <p className="text-xs mt-1 text-gray-500">
                        Manager: {request.manager.firstName} {request.manager.lastName}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No leave requests yet</p>
            )}
            
            {timeOffRequests.length > 5 && (
              <div className="text-center pt-2">
                <Link href={'/employee/all-request'}>
                <Button variant="outline" size="sm">
                  View All Requests
                </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeCalendar;