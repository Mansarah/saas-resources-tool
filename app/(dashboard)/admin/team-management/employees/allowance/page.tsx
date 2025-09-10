import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/prisma";
import AllowanceForm from "@/components/dashboard/admin/allowance-form";


const page = async () => {
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
    <div className="">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col mb-2">
          <p className="text-3xl font-bold">Holiday allowance management</p>
          <p className="text-gray-500">Manage employee holiday allowances</p>
        </div>
        <Card>
          <CardContent className="p-6">
            {!employeeAllowances || employeeAllowances?.length === 0 ? (
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
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Available Days</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeAllowances?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.availableDays}</TableCell>
                        <TableCell>
                          <AllowanceForm
                            employeeId={employee.id}
                            employeeName={`${employee.firstName} ${employee.lastName}`}
                            currentAllowance={employee.availableDays}
                          />
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

export default page;
