import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import TimeOffRequestForm from "@/components/dashboard/employee/time-off-request-form";

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
      companyId: true,
      availableDays: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  if (!user.companyId) {
    redirect("/onboarding");
  }

  const companyHolidays = await prisma.companyHoliday.findMany({
    where: {
      companyId: user.companyId,
    },
  });

  return (
    <TimeOffRequestForm
      existingRequests={requests}
      companyHolidays={companyHolidays}
      availableDays={user.availableDays}
    />
  );
};

export default page;