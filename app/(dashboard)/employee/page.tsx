import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const data = await prisma.timeOffRequest.findMany({
    where: {
      employee: {
        id: session.user.id,
      },
    },
    include: {
      employee: true,
    },
  });

  const availableDays = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      availableDays: true,
    },
  });

  const totalRequests = data.length;
  const approvedRequests = data.filter(
    (request) => request.status === "APPROVED"
  ).length;
  const pendingRequests = data.filter(
    (request) => request.status === "PENDING"
  ).length;

  return (
    <div className="">
      <div className="flex flex-col mb-6 ">
        <p className="text-3xl font-bold">Employee Dashboard.</p>
        <p className="text-gray-500">Manage your time off requests.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time Off Requests</CardTitle>
            <CardDescription>Manage your time off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button asChild>
                <Link href="/employee/new-request">New request</Link>
              </Button>
              <Button value={"outline"} asChild>
                <Link href="/employee/my-requests">View My Requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick overview</CardTitle>
            <CardDescription>Your time off at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-100 p-5 text-center">
                <div className="text-2xl font-bold">{totalRequests}</div>
                <div className="text-sm text-gray-500">Total Requests</div>
              </div>
              <div className="rounded-lg bg-gray-100 p-5 text-center">
                <div className="text-2xl font-bold">{approvedRequests}</div>
                <div className="text-sm text-gray-500">Approved Requests</div>
              </div>
              <div className="rounded-lg bg-gray-100 p-5 text-center">
                <div className="text-2xl font-bold">{pendingRequests}</div>
                <div className="text-sm text-gray-500">Pending Requests</div>
              </div>
              <div className="rounded-lg bg-gray-100 p-5 text-center">
                <div className="text-2xl font-bold">
                  {availableDays ? availableDays.availableDays : "N/A"}
                </div>
                <div className="text-sm text-gray-500">Days Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
