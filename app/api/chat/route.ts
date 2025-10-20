import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true
      }
    })

    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's chat rooms
    const rooms = await prisma.chatRoom.findMany({
      where: {
        companyId: user.companyId,
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, participantIds, isGroup = false } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create chat room
    const room = await prisma.chatRoom.create({
      data: {
        name: name || `Chat with ${participantIds.length} participants`,
        companyId: user.companyId,
        isGroup,
        participants: {
          create: [
            { userId: user.id },
            ...participantIds.map((id: string) => ({ userId: id }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}