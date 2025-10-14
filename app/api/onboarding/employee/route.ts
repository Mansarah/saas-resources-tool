import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { department, invitationCode } = await request.json();

    // Check if user already has a company
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (existingUser?.companyId) {
      return NextResponse.json({ error: "User already has a company" }, { status: 400 });
    }

    const code = await prisma.code.findFirst({
      where: {
        code: invitationCode,
        used: false,
      },
    });

    if (!code) {
      return NextResponse.json({ error: "Invalid invitation code" }, { status: 400 });
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        role: "EMPLOYEE",
        department: department || null,
        companyId: code.companyId,
        onboardingCompleted: true,
      },
    });

    await prisma.code.update({
      where: {
        id: code.id,
      },
      data: {
        used: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee onboarding error:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}