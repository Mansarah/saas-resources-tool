/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePusher } from './usePusher'
import { useEffect } from 'react'

// Fetch chat rooms
export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch chat rooms')
      return response.json()
    },
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Fetch messages for a room
export const useRoomMessages = (roomId: string | null) => {
  const queryClient = useQueryClient()
  
  // Use Pusher for real-time updates
  const channelName = roomId ? `chat-${roomId}` : null
  const newMessage = usePusher(channelName, 'new-message')

  const query = useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: async () => {
      if (!roomId) return { messages: [], nextCursor: null }
      
      const response = await fetch(`/api/chat/${roomId}/messages?limit=50`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Update messages when new message arrives via Pusher
  useEffect(() => {
    if (newMessage && roomId) {
      queryClient.setQueryData(['room-messages', roomId], (old: any) => {
        if (!old?.messages) return old
        
        // Check if message already exists to prevent duplicates
        const messageExists = old.messages.some((msg: any) => msg.id === newMessage.id)
        if (!messageExists) {
          return {
            ...old,
            messages: [...old.messages, newMessage]
          }
        }
        return old
      })
    }
  }, [newMessage, roomId, queryClient])

  return query
}

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      const response = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Optimistically update the messages
      queryClient.setQueryData(['room-messages', variables.roomId], (old: any) => {
        if (!old?.messages) return old
        
        const messageExists = old.messages.some((msg: any) => msg.id === data.id)
        if (!messageExists) {
          return {
            ...old,
            messages: [...old.messages, data]
          }
        }
        return old
      })
      
      // Invalidate and refetch rooms to update last message
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

// Create room mutation
export const useCreateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ participantIds, name, isGroup }: { 
      participantIds: string[]; 
      name?: string; 
      isGroup?: boolean 
    }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          participantIds,
          isGroup: isGroup || participantIds.length > 1
        }),
      })
      if (!response.ok) throw new Error('Failed to create chat room')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}