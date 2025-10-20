import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isTyping } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is participant of the room
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Trigger typing event
    if (isTyping) {
      await pusherServer.trigger(`chat-${roomId}`, 'user-typing', {
        userId: user.id,
        userName: user.name || `${user.firstName} ${user.lastName}`.trim(),
        isTyping: true
      })
    } else {
      await pusherServer.trigger(`chat-${roomId}`, 'user-stopped-typing', {
        userId: user.id
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}