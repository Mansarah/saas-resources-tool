import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
    <div className="max-w-full bg-white p-2 rounded-md">
    
         <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-xs text-gray-600 mt-0.5">  Manage your company information and branding</p>
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