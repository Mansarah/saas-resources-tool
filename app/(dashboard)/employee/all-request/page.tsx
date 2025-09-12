import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col ">
          <p className="text-3xl font-bold">My Time Off Requests</p>
          <p className="text-gray-500">
            View and manage your time off requests
          </p>
        </div>
        <Button asChild>
          <Link href={"/employee/new-request"}>New Request</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-gray-500">
                You don&apos;t have any time off requests yet.
              </p>
              <Button className="mt-4" asChild>
                <Link href={"/employee/new-request"}>
                  Create your first request
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "PENDING"
                              ? "secondary"
                              : request.status === "APPROVED"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request?.manager
                          ? `${request?.manager?.firstName} ${request?.manager?.lastName}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>{request?.notes || "No notes"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
