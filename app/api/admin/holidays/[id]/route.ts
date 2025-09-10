import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const holiday = await prisma.companyHoliday.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    if (holiday.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, date, isRecurring } = await request.json();

    const updatedHoliday = await prisma.companyHoliday.update({
      where: { id: params.id },
      data: {
        name,
        date: new Date(date),
        isRecurring,
      },
    });

    return NextResponse.json(updatedHoliday);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update company holiday" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingHoliday = await prisma.companyHoliday.findUnique({
      where: {
        id: params.id,
      },
      select: {
        companyId: true,
      },
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    if (existingHoliday.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.companyHoliday.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete company holiday" },
      { status: 500 }
    );
  }
}