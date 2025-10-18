import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RequestTable from "@/components/dashboard/employee/request-table";


const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId: dbUser.id,
    },
    include: {
      manager: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <RequestTable 
      requests={requests}
      user={dbUser}
    />
  );
};

export default page;