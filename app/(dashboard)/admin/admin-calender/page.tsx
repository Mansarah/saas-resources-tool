import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminCalendar from '@/components/dashboard/admin/admin-calendar';

async function getCalendarData(companyId: string) {
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
        employee: {
          companyId: companyId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch company holidays
    const companyHolidays = await prisma.companyHoliday.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch all employees with their leave data
    const employees = await prisma.user.findMany({
      where: {
        companyId: companyId,
        role: {
          in: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        availableDays: true,
        department: true,
        role: true,
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
      orderBy: {
        createdAt: 'desc',
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

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      company: true,
    },
  });

  if (!adminUser || !adminUser.company) {
    redirect("/onboarding");
  }

  const companyId = adminUser.companyId;

  if (!companyId) {
    redirect("/onboarding");
  }

  const calendarData = await getCalendarData(companyId);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminCalendar 
        timeOffRequests={calendarData.timeOffRequests} 
        companyHolidays={calendarData.companyHolidays}
        employees={calendarData.employees}
      />
    </div>
  );
}