// app/admin/time-off-requests/page.tsx
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TimeOffRequestTable } from "@/components/dashboard/admin/time-off-request-table";

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect("/auth/signin");
  }

  const companyId = session.user.companyId;

  const timeOffRequest = await prisma.timeOffRequest.findMany({
    where: {
      employee: { companyId },
    },
    include: {
      employee: true,
      manager: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
 <div className="max-w-full bg-white p-2 rounded-md space-y-2">
     
       <div>
          <h1 className="text-xl font-bold text-gray-900">Time Off Requests</h1>
          <p className="text-xs text-gray-600 mt-0.5">View and manage all time off requests</p>
        </div>

        <div className="bg-white rounded-md border border-purple-200 p-1">
          <TimeOffRequestTable data={timeOffRequest} />
        </div>
     
    </div>
  );
};

export default Page;
