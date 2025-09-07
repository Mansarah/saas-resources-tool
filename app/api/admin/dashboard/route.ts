import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        companyId: true,
        role: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [pendingRequestsCount, approvedRequestsCount, employeeCount, activeInvitationCodesCount] = 
      await Promise.all([
        prisma.timeOffRequest.count({
          where: {
            employee: {
              companyId: companyId,
            },
            status: "PENDING",
          },
        }),
        prisma.timeOffRequest.count({
          where: {
            employee: {
              companyId: companyId,
            },
            status: "APPROVED",
          },
        }),
        prisma.user.count({
          where: {
            companyId,
            role: {
              in: ["EMPLOYEE", "ADMIN"],  
            },
          },
        }),
        prisma.code.count({
          where: {
            used: false,
            companyId,
          },
        })
      ]);

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

    return NextResponse.json({
      companyName: user.company?.name,
      dashboardData: data,
      activeInvitationCodesCount
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}