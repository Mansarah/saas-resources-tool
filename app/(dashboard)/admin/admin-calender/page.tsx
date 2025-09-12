
import AdminCalendar from '@/components/dashboard/admin/admin-calendar';
import { prisma } from '@/lib/prisma';

async function getCalendarData() {
  try {
    // Fetch all time off requests
    const timeOffRequests = await prisma.timeOffRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      where: {
        status: 'APPROVED',
      },
    });

    // Fetch company holidays
    const companyHolidays = await prisma.companyHoliday.findMany();

    // Fetch all employees with their leave data
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'MANAGER'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        availableDays: true,
        department: true,
        timeOffRequests: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            type: true,
            workingDaysCount: true,
          },
        },
      },
    });

    // Calculate leave statistics for each employee
    const employeesWithStats = employees.map(employee => {
      const totalLeaveTaken = employee.timeOffRequests.reduce(
        (sum, request) => sum + request.workingDaysCount,
        0
      );
      
      return {
        ...employee,
        totalLeaveTaken,
        remainingLeave: employee.availableDays - totalLeaveTaken,
      };
    });

    return {
      timeOffRequests: JSON.parse(JSON.stringify(timeOffRequests)),
      companyHolidays: JSON.parse(JSON.stringify(companyHolidays)),
      employees: JSON.parse(JSON.stringify(employeesWithStats)),
    };
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return {
      timeOffRequests: [],
      companyHolidays: [],
      employees: [],
    };
  }
}

export default async function page() {
  const calendarData = await getCalendarData();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Company Calendar</h1>
      <AdminCalendar 
        timeOffRequests={calendarData.timeOffRequests} 
        companyHolidays={calendarData.companyHolidays}
        employees={calendarData.employees}
      />
    </div>
  );
}