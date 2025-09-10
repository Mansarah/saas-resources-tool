import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

const Page = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      companyId: true,
    },
  });

  // console.log(` user is ${user}`);

  if (!user?.companyId) {
    redirect("/onboarding");
  }

  const users = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  return (
    <div className="">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col mb-2">
          <p className="text-3xl font-bold">Employees</p>
          <p className="text-gray-500">Manage employee accounts</p>
        </div>
        <Card>
          <CardContent>
            {users?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-gray-500">No employees found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">
                          {user.role}
                        </TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="link" asChild>
                            <Link href="/admin/team-management/employees/allowance">View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
