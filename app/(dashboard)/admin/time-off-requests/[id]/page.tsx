import ApproveRejectButtons from "@/components/dashboard/admin/approve-reject-buttons";
import { Badge } from "@/components/ui/badge";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateDays, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  const { id } = params;
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!request) return notFound();
  const employee = await prisma.user.findUnique({
    where: { id: request.employeeId },
    include: { company: true },
  });
  const manager = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true },
  });
  if (manager?.companyId !== employee?.companyId) redirect("/admin/time-off-requests");
  const daysCount = calculateDays(request.startDate, request.endDate);

  return (
    <div className="space-y-2 bg-gray-50 min-h-screen">
    

    
      <div className="flex items-center  gap-2">
    <Link
          href="/admin/time-off-requests"
          className="text-xs text-gray-600 hover:text-primary flex items-center gap-1"
        >
         <ArrowLeft className="w-4 h-4 "/> 
        </Link>
          <h1 className="text-xl font-bold text-gray-900">Time Off Request Details</h1>
        
        </div>
      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Request Info */}
        <section className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
          <header className="px-5 py-3 border-b border-purple-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Request Information</h2>
          </header>
          <div className="p-5 text-sm">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Status</dt>
                <dd className="mt-0.5">
                  <Badge
                    variant={
                      request.status === "PENDING"
                        ? "secondary"
                        : request.status === "APPROVED"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Type</dt>
                <dd className="mt-0.5">{request.type}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Start Date</dt>
                <dd className="mt-0.5">{formatDate(request.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">End Date</dt>
                <dd className="mt-0.5">{formatDate(request.endDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Duration</dt>
                <dd className="mt-0.5">
                  {daysCount} day{daysCount !== 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Working Days</dt>
                <dd className="mt-0.5">
                  {request.workingDaysCount} day{request.workingDaysCount !== 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Created</dt>
                <dd className="mt-0.5">{formatDate(request.createdAt)}</dd>
              </div>
              {request.reason && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Reason</dt>
                  <dd className="mt-0.5">{request.reason}</dd>
                </div>
              )}
              {request.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Notes</dt>
                  <dd className="mt-0.5">{request.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Employee Info */}
        <section className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
          <header className="px-5 py-3 border-b border-purple-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Employee Information</h2>
          </header>
          <div className="p-5 text-sm">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Name</dt>
                <dd className="mt-0.5 font-medium">
                  {request.employee.firstName} {request.employee.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Email</dt>
                <dd className="mt-0.5">{request.employee.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Role</dt>
                <dd className="mt-0.5">{request.employee.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Department</dt>
                <dd className="mt-0.5">{request.employee.department || "N/A"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* Approve/Reject Buttons (if pending) */}
      {request.status === "PENDING" && (
        <div className="flex justify-end mt-4">
          <ApproveRejectButtons id={id} employeeEmail={request.employee.email} />
        </div>
      )}
    </div>
  );
};

export default Page;
