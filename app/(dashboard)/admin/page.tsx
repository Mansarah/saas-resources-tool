// app/admin/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Building2,
  PieChart,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Suspense } from "react";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Types
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}

interface RequestItemProps {
  request: {
    employee: {
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    };
    type: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
    status: string;
    workingDaysCount: number;
    createdAt: Date;
    id: string;
  };
}

interface EmployeeItemProps {
  employee: {
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role: string;
    department?: string | null;
    availableDays: number;
    createdAt: Date;
  };
}

// StatCard component
const StatCard = ({ title, value, icon: Icon, color, description }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 p-3">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <h3 className="text-xl font-bold text-gray-900">
          {value?.toLocaleString()}
        </h3>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${color} shadow-sm`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
);

const RequestItem = ({ request }: RequestItemProps) => (
  <div className="group p-2 rounded border border-purple-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
    <div className="flex justify-between items-start gap-1 mb-1">
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {request.employee.name || `${request.employee.firstName} ${request.employee.lastName}`}
        </h4>
        <p className="text-gray-600 text-xs mt-0.5">
          {request.type} • {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
        </p>
        {request.reason && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{request.reason}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Badge 
          variant={
            request.status === 'APPROVED' ? 'default' : 
            request.status === 'REJECTED' ? 'destructive' : 'secondary'
          } 
          className="text-xs px-1.5 py-0 h-5"
        >
          {request.status}
        </Badge>
      </div>
    </div>
    <div className="flex justify-between items-center mt-1">
      <span className="text-xs text-gray-500">
        {request.workingDaysCount} day{request.workingDaysCount !== 1 ? 's' : ''}
      </span>
      <span className="text-xs text-gray-500">
        {new Date(request.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const EmployeeItem = ({ employee }: EmployeeItemProps) => (
  <div className="group p-2 rounded border border-purple-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
    <div className="flex justify-between items-start gap-1">
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {employee.name || `${employee.firstName} ${employee.lastName}`}
        </h4>
        <p className="text-gray-600 text-xs mt-0.5">{employee.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
            {employee.role}
          </Badge>
          {employee.department && (
            <span className="text-xs text-gray-500">{employee.department}</span>
          )}
        </div>
      </div>
    </div>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs text-gray-500">
        {employee.availableDays} days left
      </span>
      <span className="text-xs text-gray-500">
        Joined {new Date(employee.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

// Loading Skeletons
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-12 bg-gray-300 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

const RecentRequestsSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200">
    <div className="p-3 border-b border-gray-200">
      <div className="h-5 w-48 bg-gray-300 rounded"></div>
      <div className="h-4 w-36 bg-gray-200 rounded mt-1"></div>
    </div>
    <div className="p-3">
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-2 rounded border border-gray-200 animate-pulse">
            <div className="flex justify-between items-start gap-1 mb-1">
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-40 bg-gray-200 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-300 rounded"></div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="h-3 w-12 bg-gray-200 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SidebarSkeleton = () => (
  <div className="space-y-3">
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-3 border-b border-gray-200">
        <div className="h-5 w-36 bg-gray-300 rounded"></div>
        <div className="h-4 w-28 bg-gray-200 rounded mt-1"></div>
      </div>
      <div className="p-3">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5"></div>
                <div className="h-3 w-6 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-3 border-b border-gray-200">
        <div className="h-5 w-32 bg-gray-300 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mt-1"></div>
      </div>
      <div className="p-3">
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-2 rounded border border-gray-200">
              <div className="space-y-1">
                <div className="h-4 w-28 bg-gray-300 rounded"></div>
                <div className="h-3 w-36 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Async Components
async function StatsCards({ companyId, employeeCount }: { companyId: string; employeeCount: number }) {
  const [pendingRequests, approvedRequestsCount, activeInvitationCodesCount] = await Promise.all([
    // Pending requests
    prisma.timeOffRequest.findMany({
      where: {
        employee: { companyId },
        status: "PENDING",
      },
      include: {
        employee: {
          select: { name: true, firstName: true, lastName: true, email: true },
        },
      },
      take: 5,
    }),
    // Approved requests count
    prisma.timeOffRequest.count({
      where: {
        employee: { companyId },
        status: "APPROVED",
      },
    }),
    // Active invitation codes
    prisma.code.count({
      where: {
        used: false,
        companyId,
      },
    }),
  ]);

  const cardConfig: StatCardProps[] = [
    {
      title: 'Pending Requests',
      value: pendingRequests.length,
      icon: AlertCircle,
      color: 'bg-amber-600',
      description: 'Awaiting approval',
    },
    {
      title: 'Team Members',
      value: employeeCount,
      icon: Users,
      color: 'bg-blue-600',
      description: 'Active employees',
    },
    {
      title: 'Approved Time Off',
      value: approvedRequestsCount,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'This period',
    },
    {
      title: 'Invitation Codes',
      value: activeInvitationCodesCount,
      icon: Mail,
      color: 'bg-purple-600',
      description: 'Available codes',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cardConfig.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}

async function RecentRequests({ companyId }: { companyId: string }) {
  const [recentRequests, pendingRequests] = await Promise.all([
    // Recent requests
    prisma.timeOffRequest.findMany({
      where: { employee: { companyId } },
      include: {
        employee: {
          select: { name: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Pending requests count
    prisma.timeOffRequest.count({
      where: {
        employee: { companyId },
        status: "PENDING",
      },
    }),
  ]);

  return (
    <div className="bg-white rounded-lg border border-purple-200">
      <div className="p-3 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
              <Clock className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Time Off Requests</h2>
              <p className="text-xs text-gray-600 mt-0.5">Latest employee requests</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {pendingRequests} Pending
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {recentRequests.length > 0 ? (
            recentRequests.map((request) => (
              <RequestItem key={request.id} request={request} />
            ))
          ) : (
            <div className="text-center py-6">
              <Clock className="h-6 w-6 mx-auto mb-1 text-gray-400" />
              <p className="text-gray-500 text-xs">No time off requests yet</p>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-purple-200">
          <Button asChild variant="outline" size="sm" className="w-full text-xs">
            <Link href="/admin/time-off-requests">View All Requests</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

async function TimeOffDistribution({ companyId }: { companyId: string }) {
  const [timeOffStats, approvedRequestsCount] = await Promise.all([
    // Time off statistics
    prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "TimeOffRequest" 
      WHERE "employeeId" IN (
        SELECT id FROM "User" WHERE "companyId" = ${companyId}
      ) AND status = 'APPROVED'
      GROUP BY type
    ` as Promise<{ type: string; count: bigint }[]>,
    // Approved requests count
    prisma.timeOffRequest.count({
      where: {
        employee: { companyId },
        status: "APPROVED",
      },
    }),
  ]);

  const timeOffDistribution = timeOffStats.map(stat => ({
    type: stat.type,
    count: Number(stat.count),
    percentage: approvedRequestsCount > 0 ? Math.round((Number(stat.count) / approvedRequestsCount) * 100) : 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-purple-200">
      <div className="p-3 border-b border-purple-200">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-purple-50 flex items-center justify-center">
            <PieChart className="w-3 h-3 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Time Off Types</h2>
            <p className="text-xs text-gray-600 mt-0.5">Approved requests</p>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-2">
          {timeOffDistribution.map((item) => (
            <div key={item.type} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 capitalize">{item.type.toLowerCase()}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-600 h-1.5 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-gray-900 font-medium w-8 text-right">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
          {timeOffDistribution.length === 0 && (
            <div className="text-center py-4">
              <PieChart className="h-6 w-6 mx-auto mb-1 text-gray-400" />
              <p className="text-gray-500 text-xs">No approved requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function RecentEmployees({ companyId }: { companyId: string }) {
  const recentEmployees = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["EMPLOYEE", "ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      department: true,
      availableDays: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return (
    <div className="bg-white rounded-lg border border-purple-200">
      <div className="p-3 border-b border-purple-200">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">
            <Users className="w-3 h-3 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
            <p className="text-xs text-gray-600 mt-0.5">Recently joined</p>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {recentEmployees.length > 0 ? (
            recentEmployees.map((employee) => (
              <EmployeeItem key={employee.id} employee={employee} />
            ))
          ) : (
            <div className="text-center py-4">
              <Users className="h-6 w-6 mx-auto mb-1 text-gray-400" />
              <p className="text-gray-500 text-xs">No team members</p>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-purple-200">
          <Button asChild variant="outline" size="sm" className="w-full text-xs">
            <Link href="/admin/employees">Manage Team</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


const quickActions = [
  {
    title: "Time Off Requests",
    description: "Manage employee requests",
    href: "/admin/time-off-requests",
    icon: Clock,
    color: "text-blue-600",
  },
  {
    title: "Team Management",
    description: "View and manage team",
    href: "/admin/employees",
    icon: Users,
    color: "text-green-600",
  },
  {
    title: "Company Settings",
    description: "Configure company",
    href: "/admin/company-settings",
    icon: Building2,
    color: "text-purple-600",
  },
  {
    title: "Invitation Codes",
    description: "Manage access codes",
    href: "/admin/invitation-codes",
    icon: Mail,
    color: "text-amber-600",
  },
];

const QuickActions = () => (
  <div className="bg-white rounded-lg border border-purple-200">
    <div className="p-3 border-b border-purple-200">
      <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
      <p className="text-xs text-gray-600 mt-0.5">Frequently used management tools</p>
    </div>
    <div className="p-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            asChild
            variant="outline"
            className="h-auto p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all border-gray-300"
          >
            <Link href={action.href}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <div className="text-center">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  </div>
);

// Main Page Component
export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      company: {
        include: {
          users: {
            where: {
              role: { in: ["EMPLOYEE", "ADMIN"] },
            },
          },
        },
      },
    },
  });

  if (!adminUser || !adminUser.company) {
    redirect("/onboarding");
  }

  const companyId = adminUser.companyId;
  if (!companyId) {
    redirect("/onboarding");
  }

  const employeeCount = adminUser.company.users.length;

  return (
    <div className="min-h-screen p-3 space-y-3 bg-gray-50">
    
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{adminUser.company.name}</h1>
          <p className="text-xs text-gray-600">Time off management overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {employeeCount} Team Members
          </Badge>
        </div>
      </div>

  
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards companyId={companyId} employeeCount={employeeCount} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-3">
      
          <QuickActions />

       
          <Suspense fallback={<RecentRequestsSkeleton />}>
            <RecentRequests companyId={companyId} />
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
       
          <Suspense fallback={<SidebarSkeleton />}>
            <TimeOffDistribution companyId={companyId} />
          </Suspense>

         
          <Suspense fallback={<SidebarSkeleton />}>
            <RecentEmployees companyId={companyId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}