import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Verify user has access to this room
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    // Update user's last read time
    await prisma.chatParticipant.update({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    })

    return NextResponse.json({
      messages: messages.reverse(),
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
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
      },
      include: {
        room: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Create message in database
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: user.id,
        content: content.trim(),
        messageType: 'TEXT'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        room: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Update room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    })

    // Get all participant IDs for real-time updates
    const participantIds = participant.room.participants.map(p => p.user.id)

    // Prepare real-time data
    const messageData = {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      isEdited: message.isEdited,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        image: message.sender.image,
        role: message.sender.role,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName
      }
    }

    const roomUpdateData = {
      roomId: message.roomId,
      lastMessage: message.content,
      lastMessageSender: message.sender.name,
      lastMessageTime: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      unreadCount: 1
    }

    try {
      // Trigger new message event to all room participants
      await pusherServer.trigger(`chat-${roomId}`, 'new-message', messageData)

      // Trigger room update event for sidebar updates
      await pusherServer.trigger(`chat-${roomId}`, 'room-updated', roomUpdateData)

      // Trigger individual events for each participant's sidebar update
      participantIds.forEach(async (participantId) => {
        await pusherServer.trigger(`user-${participantId}`, 'chat-update', {
          type: 'new-message',
          roomId,
          message: messageData,
          timestamp: new Date().toISOString()
        })
      })

      // Trigger typing stopped event
      await pusherServer.trigger(`chat-${roomId}`, 'typing-stopped', {
        userId: user.id,
        userName: user.name
      })

    } catch (pusherError) {
      console.error('Pusher trigger error:', pusherError)
      // Don't fail the request if Pusher fails, just log it
    }

    return NextResponse.json(messageData)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}