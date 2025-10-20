/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'

export const usePusher = (channelName: string | null, eventName: string = 'new-message') => {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!channelName) return

    try {
      const channel = pusherClient.subscribe(channelName)
      
      const handler = (data: any) => {
        setData(data)
      }

      channel.bind(eventName, handler)

      return () => {
        channel.unbind(eventName, handler)
        pusherClient.unsubscribe(channelName)
      }
    } catch (error) {
      console.error('Pusher subscription error:', error)
    }
  }, [channelName, eventName])

  return data
}

// New hook for unread messages count
export const useUnreadMessages = (roomId: string) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!roomId) return

    const channel = pusherClient.subscribe(`chat-${roomId}`)
    
    const handler = () => {
      setUnreadCount(prev => prev + 1)
    }

    channel.bind('new-message', handler)

    return () => {
      channel.unbind('new-message', handler)
      pusherClient.unsubscribe(`chat-${roomId}`)
    }
  }, [roomId])

  const markAsRead = () => setUnreadCount(0)

  return { unreadCount, markAsRead }
}