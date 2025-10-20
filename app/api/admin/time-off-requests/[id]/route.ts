import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Updated type
) {
  try {
    const { id } = await context.params; // ✅ Await the Promise

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const request_data = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!request_data) {
      return NextResponse.json(
        { error: "Time off request not found" },
        { status: 404 }
      );
    }

    if (request_data.employee.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status, notes } = await request.json();

    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status,
        notes,
        managerId: user.id,
      },
    });

    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: request_data.employeeId },
        data: {
          availableDays: {
            decrement: updatedRequest.workingDaysCount,
          },
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update time off request status" },
      { status: 500 }
    );
  }
}
