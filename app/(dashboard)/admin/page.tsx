
import {  redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";



const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      companyId: true,
      company: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!adminUser) {
    redirect("/onboarding");
  }

  const companyId = adminUser.companyId;
  const companyName = adminUser.company?.name;

  const pendingRequestsCount = await prisma.timeOffRequest.count({
    where: {
      employee: {
        companyId: companyId,
      },
      status: "PENDING",
    },
  });

  const approvedRequestsCount = await prisma.timeOffRequest.count({
    where: {
      employee: {
        companyId: companyId,
      },
      status: "APPROVED",
    },
  });
    // in: ["EMPLOYEE", "ADMIN"],
  const employeeCount = await prisma.user.count({
    where: {
      companyId,
      role: {
        in: ["EMPLOYEE", "ADMIN"],  
      },
    },
  });

  const activeInvitationCodesCount = await prisma.code.count({
    where: {
      used: false,
      companyId,
    },
  });

  const data = [
    {
      title: "Pending Requests",
      data: pendingRequestsCount,
    },
    {
      title: "Approved Requests",
      data: approvedRequestsCount,
    },
    {
      title: "Employee Count",
      data: employeeCount,
    },
    {
      title: "Active Invitation Codes",
      data: activeInvitationCodesCount,
    },
  ];
  return (
    <div className="">
      <div className="flex flex-col  mb-2">
        <p className="text-3xl  font-bold">{companyName} Dashboard</p>
        <p className="text-gray-500">Manage your company and employees</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data?.map((item: { title: string; data: number }) => {
          return (
            <Card key={item.title}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">{item.title}</p>
                <h3 className="text-2xl font-semibold">{item.data}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid mt-2  gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Time Off Requests</CardTitle>
            <CardDescription>Manage employee time off requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/admin/time-off-requests">View all requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Manage company configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/admin/company-settings">General settings</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/company-settings/holidays">
                  Company Holidays
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/company-settings/working-days">
                  Working Days
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team management</CardTitle>
            <CardDescription>Manage your company&apos;s team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/admin/employees">View Employees</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/invitation-codes">Invitation Codes</Link>
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                You have {activeInvitationCodesCount} active invitation code
                {activeInvitationCodesCount !== 1 ? "s" : ""}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;