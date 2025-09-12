/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, User, Calendar, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimeOffRequest, CompanyHoliday, User as UserType } from "@prisma/client";
import moment from "moment";

interface EmployeeWithStats extends UserType {
  totalLeaveTaken: number;
  remainingLeave: number;
  timeOffRequests: any[];
}

interface AdminCalendarProps {
  timeOffRequests: any[];
  companyHolidays: CompanyHoliday[];
  employees: EmployeeWithStats[];
}

const AdminCalendar = ({ timeOffRequests, companyHolidays, employees }: AdminCalendarProps) => {
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
            
            {timeOffRequestsForDate.map(request => (
              <div 
                key={request.id} 
                className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate"
                title={`${request.employee.firstName} ${request.employee.lastName} - ${request.type}`}
              >
                {request.employee.firstName} - {request.type}
              </div>
            ))}
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
          </CardContent>
        </Card>
      </div>
      
      {/* Employee List Section - 35% width */}
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
                  <h3 className="font-medium mb-2">Time Off Requests</h3>
                  <div className="space-y-2">
                    {selectedDateRequests.map(request => (
                      <div key={request.id} className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="font-medium">{request.employee.firstName} {request.employee.lastName}</p>
                        <p className="text-sm text-blue-700 capitalize">{request.type.toLowerCase()}</p>
                        <p className="text-xs text-gray-500">
                          {moment(request.startDate).format('MMM D')} - {moment(request.endDate).format('MMM D, YYYY')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !selectedDateHoliday && (
                <p className="text-gray-500">No time off requests for this date</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Employee Leave Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="mr-2 h-5 w-5" />
              Employee Leave Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {employees.map(employee => (
              <div key={employee.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-gray-500">{employee.department}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {employee.remainingLeave} days left
                  </Badge>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Total Allowance</p>
                    <p className="font-medium">{employee.availableDays} days</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Leave Taken</p>
                    <p className="font-medium">{employee.totalLeaveTaken} days</p>
                  </div>
                </div>
                
                {employee.timeOffRequests.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Recent leaves:</p>
                    <div className="space-y-1">
                      {employee.timeOffRequests.slice(0, 2).map(request => (
                        <div key={request.id} className="text-xs bg-gray-100 p-1 rounded">
                          {moment(request.startDate).format('MMM D')} - {moment(request.endDate).format('MMM D')}: {request.type}
                        </div>
                      ))}
                      {employee.timeOffRequests.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{employee.timeOffRequests.length - 2} more leaves
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCalendar;