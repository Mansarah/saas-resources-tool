import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeOffType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const type = formData.get("type") as string;
    const reason = formData.get("reason") as string;
    const workingDays = parseInt(formData.get("workingDays") as string) || 0;

    if (!startDate || !endDate || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        type: type as TimeOffType,
        reason,
        employeeId: dbUser.id,
        workingDaysCount: workingDays,
      },
    });

    return NextResponse.json(timeOffRequest);
  } catch (error) {
    console.error("Error creating time off request:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the request" },
      { status: 500 }
    );
  }
}