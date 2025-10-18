import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmployeeTable from "@/components/dashboard/admin/employee-table";


const Page = async () => {
   const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      company: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  if (!user.company) {
    redirect("/");
  }

  const employeeAllowances = await prisma.user.findMany({
    where: {
      companyId: user?.company.id,
    },
    orderBy: {
      lastName: "asc",
    },
    select: {
      firstName: true,
      lastName: true,
      id: true,
      email: true,
      department: true,
      role: true,
      availableDays: true,
    },
  });

  return (
    <div className="max-w-full bg-white p-2 rounded-md">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-bold text-gray-900">Employees & Holiday allowance management</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage employee accounts & employee holiday allowances</p>
        </div>
        
        <EmployeeTable employees={employeeAllowances} />
      </div>
    </div>
  );
};

export default Page;