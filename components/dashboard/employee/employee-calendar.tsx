/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Plus,
  PieChart,
  Briefcase,
} from "lucide-react";
import { TimeOffRequest, CompanyHoliday, User as UserType } from "@prisma/client";
import moment from "moment";
import Link from "next/link";

interface EmployeeCalendarProps {
  timeOffRequests: any[];
  companyHolidays: CompanyHoliday[];
  employee: UserType;
}

type ViewType = "month" | "week";

const EmployeeCalendar = ({ timeOffRequests, companyHolidays, employee }: EmployeeCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewType>("month");
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter time off requests for current employee only
  const filteredTimeOffRequests = useMemo(() => {
    return timeOffRequests.filter(request => request.employeeId === employee.id);
  }, [timeOffRequests, employee.id]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get events for the current view
  const getEventsForView = () => {
    if (view === "month") {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const viewTimeOffRequests = filteredTimeOffRequests.filter(request => {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        return startDate <= lastDayOfMonth && endDate >= firstDayOfMonth;
      });
      
      const viewHolidays = companyHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= firstDayOfMonth && holidayDate <= lastDayOfMonth;
      });
      
      return { viewTimeOffRequests, viewHolidays };
    } else {
      // Week view
      const startOfWeek = moment(currentDate).startOf('week').toDate();
      const endOfWeek = moment(currentDate).endOf('week').toDate();
      
      const viewTimeOffRequests = filteredTimeOffRequests.filter(request => {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        return startDate <= endOfWeek && endDate >= startOfWeek;
      });
      
      const viewHolidays = companyHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startOfWeek && holidayDate <= endOfWeek;
      });
      
      return { viewTimeOffRequests, viewHolidays };
    }
  };

  const { viewTimeOffRequests, viewHolidays } = getEventsForView();

  // Check if a date has time off requests
  const getTimeOffRequestsForDate = (date: Date) => {
    return filteredTimeOffRequests.filter(request => {
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

  // Navigation functions
  const prevPeriod = () => {
    if (view === "month") {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    }
  };

  const nextPeriod = () => {
    if (view === "month") {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const clearSelectedDate = () => {
    setSelectedDate(null);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return CheckCircle;
      case 'PENDING': return Clock;
      case 'REJECTED': return XCircle;
      default: return AlertCircle;
    }
  };

  // Render calendar days for month view
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 p-1 border border-gray-100 bg-gray-50/30"></div>);
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
          className={`h-20 p-1 border border-gray-100 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group ${
            isTodayDate ? 'bg-blue-100 border-blue-300' : ''
          } ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50/30' : 'bg-white'}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start mb-0.5">
            <span className={`text-xs font-medium ${
              isTodayDate ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs' : 'text-gray-700'
            }`}>
              {day}
            </span>
            {holiday && (
              <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded">H</span>
            )}
          </div>
          
          <div className="space-y-0.5 max-h-12 overflow-hidden">
            {holiday && (
              <div className="text-[10px] bg-red-100 text-red-700 p-0.5 rounded truncate border border-red-200">
                {holiday.name}
              </div>
            )}
            
            {timeOffRequestsForDate.slice(0, 2).map(request => {
              const StatusIcon = getStatusIcon(request.status);
              
              return (
                <div 
                  key={request.id} 
                  className="text-[10px] p-0.5 rounded border truncate flex items-center gap-0.5 bg-blue-100 border-blue-200 text-blue-800"
                >
                  <StatusIcon className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {request.type.toLowerCase()}
                  </span>
                </div>
              );
            })}
            
            {timeOffRequestsForDate.length > 2 && (
              <div className="text-[10px] text-gray-500 bg-gray-100 p-0.5 rounded text-center">
                +{timeOffRequestsForDate.length - 2}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = moment(currentDate).startOf('week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.clone().add(i, 'days').toDate();
      const timeOffRequestsForDate = getTimeOffRequestsForDate(date);
      const holiday = getHolidayForDate(date);
      const isTodayDate = isToday(date);
      
      days.push(
        <div 
          key={`week-day-${i}`} 
          className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 ${
            isTodayDate ? 'bg-blue-100 border-blue-300' : 'bg-white'
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {dayNames[i]}
              </div>
              <div className={`text-lg font-bold ${
                isTodayDate ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {moment(date).format('D')}
              </div>
            </div>
            {holiday && (
              <Badge variant="destructive" className="text-xs h-5">Holiday</Badge>
            )}
          </div>
          
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {holiday && (
              <div className="text-xs bg-red-100 text-red-700 p-1 rounded border border-red-200">
                🎉 {holiday.name}
              </div>
            )}
            
            {timeOffRequestsForDate.map(request => {
              const StatusIcon = getStatusIcon(request.status);
              
              return (
                <div 
                  key={request.id} 
                  className="text-xs p-1 rounded border flex items-center gap-1 bg-blue-100 border-blue-200 text-blue-800"
                >
                  <StatusIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1 truncate">
                    {request.type}
                  </span>
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

  // Statistics
  const stats = useMemo(() => {
    const approvedRequests = filteredTimeOffRequests.filter(req => req.status === 'APPROVED');
    const pendingRequests = filteredTimeOffRequests.filter(req => req.status === 'PENDING');
    const onLeaveToday = filteredTimeOffRequests.filter(request => {
      const today = new Date();
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      return today >= startDate && today <= endDate && request.status === 'APPROVED';
    }).length;

    // Calculate total leave days used (only approved requests)
    const totalLeaveDaysUsed = approvedRequests.reduce((sum, req) => sum + (req.workingDaysCount || 0), 0);

    return {
      totalRequests: filteredTimeOffRequests.length,
      approvedRequests: approvedRequests.length,
      pendingRequests: pendingRequests.length,
      onLeaveToday,
      totalLeaveDaysUsed,
      remainingDays: employee.availableDays - totalLeaveDaysUsed
    };
  }, [filteredTimeOffRequests, employee.availableDays]);

  return (
    <div className="min-h-screen p-3 space-y-3 bg-gray-50 ">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Calendar</h1>
          <p className="text-xs text-gray-600 mt-0.5">Track your time off and schedule</p>
        </div>
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-green-200 border border-green-400"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-amber-200 border border-amber-400"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-red-200 border border-red-400"></div>
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-red-300 border border-red-500"></div>
            <span>Holiday</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-9 text-xs">
            Today
          </Button>
          
          <div className="flex items-center border border-gray-300 rounded-md bg-white">
            <Button variant="ghost" size="icon" onClick={prevPeriod} className="h-7 w-7">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <div className="px-2 py-2 text-sm font-medium min-w-[140px] text-center ">
              {view === 'month' 
                ? `${monthNames[currentMonth]} ${currentYear}`
                : `Week of ${moment(currentDate).startOf('week').format('MMM D')}`
              }
            </div>
            
            <Button variant="ghost" size="icon" onClick={nextPeriod} className="h-7 w-7">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex border border-gray-300 rounded-md bg-white">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="rounded-r-none h-8 text-xs px-3"
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="rounded-l-none h-8 text-xs px-3"
            >
              Week
            </Button>
          </div>

          <Button asChild size="sm" className="h-9 text-xs bg-blue-600 hover:bg-blue-700">
            <Link href="/employee/new-request">
              <Plus className="h-3 w-3 mr-1" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-blue-200 hover:shadow-sm transition-all duration-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Days Remaining</p>
              <h3 className="text-lg font-bold text-gray-900">{stats.remainingDays}</h3>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500">
              <Calendar className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 hover:shadow-sm transition-all duration-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">On Leave Today</p>
              <h3 className="text-lg font-bold text-gray-900">{stats.onLeaveToday}</h3>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-amber-200 hover:shadow-sm transition-all duration-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Requests</p>
              <h3 className="text-lg font-bold text-gray-900">{stats.pendingRequests}</h3>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-purple-200 hover:shadow-sm transition-all duration-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Leave Days Used</p>
              <h3 className="text-lg font-bold text-gray-900">{stats.totalLeaveDaysUsed}</h3>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500">
              <PieChart className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
        {/* Calendar Section - 3/4 width */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-lg border border-blue-200">
            <div className="p-2 border-b rounded-lg border-blue-200 bg-white">
              <div className="flex items-center text-base font-semibold">
                <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                {view === 'month' ? 'Month View' : 'Week View'} 
                <Badge variant="secondary" className="ml-2 text-xs">
                  {viewTimeOffRequests.length} requests
                </Badge>
              </div>
            </div>
            <div className="p-2">
              {view === 'month' ? (
                <>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayNames.map(day => (
                      <div key={day} className="text-center font-semibold text-xs text-gray-600 py-1 bg-gray-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderMonthView()}
                  </div>
                </>
              ) : (
                <>
                  {/* Week View Header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center font-semibold text-xs text-gray-600 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Week View Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {renderWeekView()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Section - 1/4 width */}
        <div className="space-y-3">
          {/* Selected Date Details - Shows when date is selected */}
          {selectedDate && (
            <div className="bg-white rounded-lg border border-blue-200">
              <div className="p-2 border-b rounded-lg border-blue-200 bg-white flex justify-between items-center">
                <div className="text-sm font-semibold">
                  {moment(selectedDate).format('MMMM D, YYYY')}
                  {isToday(selectedDate) && (
                    <Badge variant="default" className="ml-2 text-xs">Today</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedDate}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2 space-y-3">
                {/* Time Off Requests */}
                {selectedDateRequests.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      My Time Off
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedDateRequests.map(request => {
                        const StatusIcon = getStatusIcon(request.status);
                        return (
                          <div key={request.id} className="p-2 border rounded bg-white">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="font-medium text-sm">You</p>
                                <p className="text-xs text-gray-500 capitalize">{request.type.toLowerCase()}</p>
                              </div>
                              <Badge variant={getStatusVariant(request.status)} className="text-xs h-5">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {moment(request.startDate).format('MMM D')} - {moment(request.endDate).format('MMM D, YYYY')}
                            </p>
                            {request.reason && (
                              <p className="text-xs text-gray-500 mt-1">{request.reason}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDateHoliday && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 text-xs">🎉</span>
                      </div>
                      <h3 className="font-semibold text-red-800 text-xs">Company Holiday</h3>
                    </div>
                    <p className="text-red-700 text-xs">{selectedDateHoliday.name}</p>
                  </div>
                )}

                {selectedDateRequests.length === 0 && !selectedDateHoliday && (
                  <div className="text-center py-4">
                    <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-gray-500 text-xs">No time off scheduled</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-blue-200">
            <div className="p-2 border-b rounded-lg border-blue-200 bg-white">
              <div className="text-sm font-semibold flex items-center">
                <PieChart className="mr-1 h-3 w-3 text-green-600" />
                My Leave Summary
              </div>
            </div>
            <div className="p-2">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-lg font-bold text-blue-700">{stats.remainingDays}</div>
                    <div className="text-xs text-blue-600">Days Left</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-lg font-bold text-green-700">{stats.approvedRequests}</div>
                    <div className="text-xs text-green-600">Approved</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                    <div className="text-lg font-bold text-amber-700">{stats.pendingRequests}</div>
                    <div className="text-xs text-amber-600">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
                    <div className="text-lg font-bold text-purple-700">{stats.totalLeaveDaysUsed}</div>
                    <div className="text-xs text-purple-600">Days Used</div>
                  </div>
                </div>
                
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/employee/my-requests">
                    View All Requests
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCalendar;