import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CompanyWorkingDaysForm from "@/components/dashboard/admin/company-working-days-form";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin/company-settings");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      companyId: true,
    },
  });

 
if (!user?.companyId) {
  redirect("/admin/company-settings"); 
}
  const company = await prisma.company.findUnique({
    where: {
      id: user?.companyId,
    },
    select: {
      workingDays: true,
    },
  });

  console.log(`company`, company);

  const initialWorkingDays = JSON.parse(company?.workingDays || "[]");

//   console.log(`initialWorkingDays`, initialWorkingDays);

  return (
   <div className="max-w-full bg-white p-2 rounded-md">
      <div className="flex items-center justify-between mb-2">
       
         <div>
          <h1 className="text-xl font-bold text-gray-900">Working Days</h1>
          <p className="text-xs text-gray-600 mt-0.5">          Configure your company&apos;s working days</p>
        </div>
     
      </div>
      <CompanyWorkingDaysForm initialWorkingDays={initialWorkingDays} />
    </div>
  );
};

export default page;
