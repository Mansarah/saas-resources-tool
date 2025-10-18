import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  List,
  PieChart,
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
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
    status: string;
    workingDaysCount: number;
    createdAt: Date;
  };
}

// StatCard component with div instead of Card
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

const RequestItem = ({ request }: RequestItemProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'PENDING':
        return <AlertCircle className="w-3 h-3 text-amber-600" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className="group p-2 rounded border border-purple-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
      <div className="flex justify-between items-start gap-1 mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className="text-xs px-1.5 py-0 h-5 capitalize"
            >
              {request.type.toLowerCase()}
            </Badge>
            <div className="flex items-center gap-1">
              {getStatusIcon(request.status)}
              <Badge 
                variant={getStatusVariant(request.status)} 
                className="text-xs px-1.5 py-0 h-5"
              >
                {request.status}
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 text-xs">
            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
          </p>
          {request.reason && (
            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{request.reason}</p>
          )}
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
};

const Page = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const employee = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      company: true,
      timeOffRequests: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
      },
    },
  });

  if (!employee) {
    redirect("/");
  }

  
  const [
    allRequests,
    approvedRequests,
    pendingRequests,
    rejectedRequests,
    timeOffStats,
  ] = await Promise.all([
    // All requests count
    prisma.timeOffRequest.count({
      where: {
        employeeId: employee.id,
      },
    }),

    // Approved requests count
    prisma.timeOffRequest.count({
      where: {
        employeeId: employee.id,
        status: "APPROVED",
      },
    }),

    // Pending requests count
    prisma.timeOffRequest.count({
      where: {
        employeeId: employee.id,
        status: "PENDING",
      },
    }),

    // Rejected requests count
    prisma.timeOffRequest.count({
      where: {
        employeeId: employee.id,
        status: "REJECTED",
      },
    }),

    // Time off statistics by type
    prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "TimeOffRequest" 
      WHERE "employeeId" = ${employee.id} AND status = 'APPROVED'
      GROUP BY type
    ` as Promise<{ type: string; count: bigint }[]>,
  ]);

  const recentRequests = employee.timeOffRequests;
  const availableDays = employee.availableDays;
  const usedDays = approvedRequests; 


  const timeOffDistribution = (timeOffStats as { type: string; count: bigint }[]).map(stat => ({
    type: stat.type,
    count: Number(stat.count),
    percentage: approvedRequests > 0 ? Math.round((Number(stat.count) / approvedRequests) * 100) : 0,
  }));

  const cardConfig: StatCardProps[] = [
    {
      title: 'Available Days',
      value: availableDays,
      icon: Calendar,
      color: 'bg-green-600',
      description: 'Remaining this year',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: AlertCircle,
      color: 'bg-amber-600',
      description: 'Awaiting approval',
    },
    {
      title: 'Approved Requests',
      value: approvedRequests,
      icon: CheckCircle,
      color: 'bg-blue-600',
      description: 'This year',
    },
    {
      title: 'Total Requests',
      value: allRequests,
      icon: List,
      color: 'bg-purple-600',
      description: 'All time',
    },
  ];

  const quickActions = [
    {
      title: "New Request",
      description: "Request time off",
      href: "/employee/new-request",
      icon: Plus,
      color: "text-blue-600",
    },
    {
      title: "My Requests",
      description: "View all requests",
      href: "/employee/all-request",
      icon: List,
      color: "text-green-600",
    },
    {
      title: "Calendar",
      description: "View schedule",
      href: "/employee/calender",
      icon: Calendar,
      color: "text-purple-600",
    },
   
  ];

  return (
    <div className="min-h-screen p-3 space-y-3 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {employee.firstName || employee.name || 'Employee'}!
          </h1>
          <p className="text-xs text-gray-600">Your time off dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {employee.company && (
            <Badge variant="secondary" className="text-xs">
              {employee.company.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {employee.department || 'No department'}
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
          <div className="bg-white rounded-lg border border-purple-200">
            <div className="p-3 border-b border-purple-200">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Manage your time off requests
              </p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
          <div className="bg-white rounded-lg border border-purple-200">
            <div className="p-3 border-b border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Recent Time Off Requests</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Your latest requests</p>
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
                    <RequestItem
                      key={request.id}
                      request={request}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-gray-500 text-xs">No time off requests yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/employee/new-request">
                        Create Your First Request
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              {recentRequests.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link href="/employee/all-request">
                      View All Requests
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/5 width */}
        <div className="space-y-3">
          {/* Time Off Distribution */}
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

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-purple-200">
            <div className="p-3 border-b border-purple-200">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Quick Stats</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Request overview</p>
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Approval Rate</span>
                  <span className="text-gray-900 font-medium">
                    {allRequests > 0 ? Math.round((approvedRequests / allRequests) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Rejected</span>
                  <span className="text-gray-900 font-medium">{rejectedRequests}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Days Used</span>
                  <span className="text-gray-900 font-medium">{usedDays}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Remaining</span>
                  <span className="text-gray-900 font-medium">{availableDays}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;