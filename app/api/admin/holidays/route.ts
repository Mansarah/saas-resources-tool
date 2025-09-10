import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, date, isRecurring } = await request.json();

    const holiday = await prisma.companyHoliday.create({
      data: {
        name,
        date: new Date(date),
        isRecurring,
        companyId: user.companyId!,
      },
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add company holiday" },
      { status: 500 }
    );
  }
}