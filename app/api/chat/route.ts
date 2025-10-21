import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

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
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Prepare room data for real-time update
    const roomData = {
      id: room.id,
      name: room.name,
      isGroup: room.isGroup,
      companyId: room.companyId,
      participants: room.participants,
      messages: room.messages,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString()
    }

    // Trigger real-time updates for all participants
    try {
      // Create a list of all participant IDs including the current user
      const allParticipantIds = [user.id, ...participantIds]
      
      // Trigger for all participants on their user-specific channels
      allParticipantIds.forEach(async (participantId: string) => {
        await pusherServer.trigger(`user-${participantId}`, 'room-created', roomData)
      })

      // Also trigger on a general company channel
      await pusherServer.trigger(`company-${user.companyId}`, 'room-created', roomData)

      console.log('Pusher triggers sent to:', allParticipantIds)

    } catch (pusherError) {
      console.error('Pusher trigger error:', pusherError)
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}