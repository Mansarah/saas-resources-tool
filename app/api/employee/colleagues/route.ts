import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!currentUser || !currentUser.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const colleagues = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        id: { not: currentUser.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        firstName: true,
        lastName: true
      }
    })

    return NextResponse.json({
      users: colleagues,
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        role: currentUser.role
      }
    })
  } catch (error) {
    console.error('Error fetching colleagues:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}