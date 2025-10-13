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

// StatCard component with div instead of Card
const StatCard = ({ title, value, icon: Icon, color, description }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 p-3">
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
  <div className="group p-2 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
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
  <div className="group p-2 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
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

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      company: {
        include: {
          holidays: true,
          users: {
            where: {
              role: {
                in: ["EMPLOYEE", "ADMIN"],
              },
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
  const company = adminUser.company;

  if (!companyId) {
    redirect("/onboarding");
  }

  // Fetch all the data in parallel for better performance
  const [
    pendingRequests,
    approvedRequestsCount,
    recentRequests,
    recentEmployees,
    timeOffStats,
  ] = await Promise.all([
    // Pending requests
    prisma.timeOffRequest.findMany({
      where: {
        employee: {
          companyId: companyId,
        },
        status: "PENDING",
      },
      include: {
        employee: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),

    // Approved requests count
    prisma.timeOffRequest.count({
      where: {
        employee: {
          companyId: companyId,
        },
        status: "APPROVED",
      },
    }),

    // Recent requests (mixed status)
    prisma.timeOffRequest.findMany({
      where: {
        employee: {
          companyId: companyId,
        },
      },
      include: {
        employee: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),

    // Recent employees
    prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: ["EMPLOYEE", "ADMIN"],
        },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
    }),

    // Time off statistics by type - Using raw query to avoid groupBy issues
    prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "TimeOffRequest" 
      WHERE "employeeId" IN (
        SELECT id FROM "User" WHERE "companyId" = ${companyId}
      ) AND status = 'APPROVED'
      GROUP BY type
    ` as Promise<{ type: string; count: bigint }[]>,
  ]);

  const employeeCount = company.users.length;
  const pendingRequestsCount = pendingRequests.length;
  const activeInvitationCodesCount = await prisma.code.count({
    where: {
      used: false,
      companyId: companyId,
    },
  });

  // Calculate time off type distribution
  const timeOffDistribution = (timeOffStats as { type: string; count: bigint }[]).map(stat => ({
    type: stat.type,
    count: Number(stat.count),
    percentage: approvedRequestsCount > 0 ? Math.round((Number(stat.count) / approvedRequestsCount) * 100) : 0,
  }));

  const cardConfig: StatCardProps[] = [
    {
      title: 'Pending Requests',
      value: pendingRequestsCount,
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

  return (
    <div className="min-h-screen p-3 space-y-3 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-xs text-gray-600">Time off management overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {company.users.length} Team Members
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {cardConfig.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            description={card.description}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Left Column - 4/5 width */}
        <div className="lg:col-span-4 space-y-3">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Frequently used management tools
              </p>
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

          {/* Recent Time Off Requests */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
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
                  {pendingRequestsCount} Pending
                </Badge>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <RequestItem
                      key={request.id}
                      request={request}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-gray-500 text-xs">No time off requests yet</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/admin/time-off-requests">
                    View All Requests
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/5 width */}
        <div className="space-y-3">
          {/* Time Off Distribution */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
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

          {/* Recent Team Members */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
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
                    <EmployeeItem
                      key={employee.id}
                      employee={employee}
                    />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-gray-500 text-xs">No team members</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/admin/employees">
                    Manage Team
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

export default Page;