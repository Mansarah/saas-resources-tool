
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import EmployeeCalendar from '@/components/dashboard/employee/employee-calendar';
import { redirect } from 'next/navigation';

async function getEmployeeCalendarData(userId: string) {
  try {
    // Fetch the current employee
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        availableDays: true,
        department: true,
        companyId: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Fetch the employee's time off requests
    const timeOffRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: userId,
      },
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

   
    // Fetch company holidays
   // Fetch company holidays only if companyId exists
const companyHolidays = employee.companyId
  ? await prisma.companyHoliday.findMany({
      where: {
        companyId: employee.companyId,
      },
    })
  : [];


    // Calculate leave statistics
    const approvedRequests = timeOffRequests.filter(request => request.status === 'APPROVED');
    const pendingRequests = timeOffRequests.filter(request => request.status === 'PENDING');
    
    const totalLeaveTaken = approvedRequests.reduce(
      (sum, request) => sum + request.workingDaysCount,
      0
    );
    
    const remainingLeave = employee.availableDays - totalLeaveTaken;

    return {
      employee: JSON.parse(JSON.stringify(employee)),
      timeOffRequests: JSON.parse(JSON.stringify(timeOffRequests)),
      companyHolidays: JSON.parse(JSON.stringify(companyHolidays)),
      stats: {
        totalLeaveTaken,
        remainingLeave,
        pendingRequests: pendingRequests.length,
        approvedRequests: approvedRequests.length,
      },
    };
  } catch (error) {
    console.error('Error fetching employee calendar data:', error);
    return {
      employee: null,
      timeOffRequests: [],
      companyHolidays: [],
      stats: {
        totalLeaveTaken: 0,
        remainingLeave: 0,
        pendingRequests: 0,
        approvedRequests: 0,
      },
    };
  }
}

export default async function page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return <div>Please sign in to view your calendar</div>;
  }

  const calendarData = await getEmployeeCalendarData(session.user.id);

  if (!calendarData.employee) {
    return <div>Employee data not found</div>;
  }

  return (
    <div className="max-w-full mx-auto ">

      <EmployeeCalendar 
        employee={calendarData.employee}
        timeOffRequests={calendarData.timeOffRequests} 
        companyHolidays={calendarData.companyHolidays}
       
      />
    </div>
  );
}