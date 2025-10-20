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
  const roomUpdated = usePusher(channelName, 'room-updated')

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

  // Handle new messages from Pusher - IGNORE messages that are already in the list
  useEffect(() => {
    if (newMessage && roomId) {
      queryClient.setQueryData(['room-messages', roomId], (old: any) => {
        if (!old?.messages) return old
        
        // Check if message already exists (to prevent duplicates)
        const messageExists = old.messages.some((msg: any) => 
          msg.id === newMessage.id || 
          (msg.id.startsWith('temp-') && msg.content === newMessage.content)
        )
        
        if (messageExists) {
          // Replace temp message with real message
          const filteredMessages = old.messages.filter((msg: any) => 
            !(msg.id.startsWith('temp-') && msg.content === newMessage.content)
          )
          return {
            ...old,
            messages: [...filteredMessages, newMessage]
          }
        }
        
        // Add new message if it doesn't exist
        return {
          ...old,
          messages: [...old.messages, newMessage]
        }
      })

      // Update chat rooms list to show last message
      queryClient.setQueryData(['chat-rooms'], (oldRooms: any) => {
        if (!oldRooms) return oldRooms
        
        return oldRooms.map((room: any) => {
          if (room.id === roomId) {
            return {
              ...room,
              messages: [newMessage],
              updatedAt: newMessage.createdAt
            }
          }
          return room
        })
      })
    }
  }, [newMessage, roomId, queryClient])

  // Handle room updates (for last message in sidebar)
  useEffect(() => {
    if (roomUpdated && roomId) {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    }
  }, [roomUpdated, roomId, queryClient])

  return query
}

// Send message mutation - FIXED: No duplicate messages
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['room-messages', variables.roomId] })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['room-messages', variables.roomId])

      // Create optimistic message - ALWAYS on right side for current user
      const tempMessage = {
        id: `temp-${Date.now()}`,
        roomId: variables.roomId,
        senderId: 'temp',
        content: variables.content,
        messageType: 'TEXT' as const,
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: {
          id: 'temp',
          name: 'You',
          email: '',
          image: null,
          role: 'USER',
          firstName: 'You',
          lastName: ''
        }
      }

      // Optimistically update messages - temp message appears on right
      queryClient.setQueryData(['room-messages', variables.roomId], (old: any) => {
        if (!old?.messages) return { messages: [tempMessage], nextCursor: null }
        
        // Remove any existing temp messages with same content to prevent duplicates
        const filteredMessages = old.messages.filter((msg: any) => 
          !(msg.id.startsWith('temp-') && msg.content === variables.content)
        )
        return {
          ...old,
          messages: [...filteredMessages, tempMessage]
        }
      })

      // Optimistically update chat rooms
      queryClient.setQueryData(['chat-rooms'], (oldRooms: any) => {
        if (!oldRooms) return oldRooms
        
        return oldRooms.map((room: any) => {
          if (room.id === variables.roomId) {
            return {
              ...room,
              messages: [tempMessage],
              updatedAt: tempMessage.createdAt
            }
          }
          return room
        })
      })

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // Rollback on error - remove temp message
      if (context?.previousMessages) {
        queryClient.setQueryData(['room-messages', variables.roomId], context.previousMessages)
      }
    },
    onSuccess: (data, variables) => {
      // The real message will come via Pusher and replace the temp message
      // No need to manually update here as Pusher will handle it
    },
    onSettled: (data, error, variables) => {
      // Only refetch on error to ensure consistency
      if (error) {
        queryClient.invalidateQueries({ queryKey: ['room-messages', variables.roomId] })
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      }
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

// Mark messages as read
export const useMarkAsRead = () => {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`/api/chat/${roomId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) throw new Error('Failed to mark as read')
      return response.json()
    },
    onSuccess: (_, roomId) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

// Real-time room updates hook
export const useRoomUpdates = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const channelName = roomId ? `chat-${roomId}` : null
  const roomUpdate = usePusher(channelName, 'room-updated')

  useEffect(() => {
    if (roomUpdate && roomId) {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    }
  }, [roomUpdate, roomId, queryClient])
}