import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { socket_id, channel_name } = await req.json()

    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: session.user.email,
      user_info: {
        email: session.user.email,
        name: session.user.name,
      },
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}