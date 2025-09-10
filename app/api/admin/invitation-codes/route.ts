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
        role: true,
        companyId: true,
      },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const generateRandomCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    let code = generateRandomCode();

    let existingCode = await prisma.code.findFirst({
      where: {
        code,
      },
    });

    while (existingCode) {
      code = generateRandomCode();
      existingCode = await prisma.code.findFirst({
        where: {
          code,
        },
      });
    }

    const newCode = await prisma.code.create({
      data: {
        code,
        companyId: user.companyId!,
        used: false,
      },
    });

    return NextResponse.json(newCode);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate invitation code" },
      { status: 500 }
    );
  }
}