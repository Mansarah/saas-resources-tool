import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import CompanyProfileForm from "@/components/dashboard/admin/company-profile-form";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      companyId: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }
if (!user?.companyId) {
  redirect("/"); 
}
  const company = await prisma.company.findUnique({
    where: {
      id: user.companyId,
    },
    select: {
      id: true,
      name: true,
      logo: true,
      website: true,
    },
  });

  if (!company) {
    redirect("/onboarding");
  }

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-3xl font-bold">Company Profile</p>
          <p className="text-gray-500">Update your company profile</p>
        </div>
       
      </div>
      <CompanyProfileForm
        initialData={{
          name: company.name,
          website: company.website || "",
          logo: company.logo || "",
        }}
      />
    </div>
  );
};

export default page;
