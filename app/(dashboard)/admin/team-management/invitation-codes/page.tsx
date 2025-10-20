
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import React from 'react'
import InvitationCodes from '@/components/dashboard/admin/invitation-codes';

const page = async () => {
  const session = await getServerSession(authOptions);
  console.log('session',session)

  if (!session?.user?.id) {
    redirect("/")
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      companyId: true, 
      role: true
    }
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }
if (!user.companyId) {
  redirect("/")
}

  const codes = await prisma.code.findMany({
    where: {
      companyId: user.companyId
    },
    orderBy: {
      used: "asc"
    }
  })

  return (
    <InvitationCodes session={session}  initialCodes={codes} />
  )
}

export default page