"use client"
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import Loader from "@/components/loader/loader";
import { useClientCookies } from "@/hooks/use-client-cookie";



const Page = () => {
  // const { data: session, status } = useSession();

  
 
const { values, isClient } = useClientCookies(['user_id'])
 
    const router = useRouter()
  
   
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/dashboard");
      return response.data;
    },
    enabled: !!values?.user_id, 
  });
//  if (!isLoading && !isClient) {
//       router.push("/auth/signin")
//       return null
//     }
  
  // Handle redirect based on session status
  // useEffect(() => {
  //   if (status === "unauthenticated") {
  //     redirect("/auth/signin");
  //   }
  // }, [status]);

  if ( isLoading || !data || !isClient) {
    return <Loader/>
  }

  // if (!session?.user?.id) {
  //   return <div>Unauthorized</div>;
  // }

  // if (isLoading) {
  //   return <div>Loading dashboard data...</div>;
  // }

  if (isError  ) {
    return <div>Failed to load dashboard data</div>;
  }

  return (
    <div className="">
      <div className="flex flex-col  mb-2">
        <p className="text-3xl  font-bold">{data.companyName} Dashboard</p>
        <p className="text-gray-500">Manage your company and employees</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data.dashboardData?.map((item: { title: string; data: number }) => {
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
                You have {data.activeInvitationCodesCount} active invitation code
                {data.activeInvitationCodesCount !== 1 ? "s" : ""}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;