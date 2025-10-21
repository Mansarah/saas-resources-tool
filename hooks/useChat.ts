/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePusher } from './usePusher'
import { useEffect, useState } from 'react'


export const useChatRooms = () => {
  const queryClient = useQueryClient()
  
 
  const newRoom = usePusher('room-updates', 'room-created')
  const roomsUpdated = usePusher('room-updates', 'rooms-updated')

  const query = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const response = await fetch('/api/chat')
      if (!response.ok) throw new Error('Failed to fetch chat rooms')
      return response.json()
    },
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, 
  })

 
  useEffect(() => {
    if (newRoom) {
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!old) return [newRoom]
        
     
        const roomExists = old.some((room: any) => room.id === newRoom.id)
        if (roomExists) return old
        
        return [newRoom, ...old]
      })
    }
  }, [newRoom, queryClient])

 
  useEffect(() => {
    if (roomsUpdated) {
      if (roomsUpdated.type === 'room-created') {
        queryClient.setQueryData(['chat-rooms'], (old: any) => {
          if (!old) return [roomsUpdated.room]
          
          const roomExists = old.some((room: any) => room.id === roomsUpdated.room.id)
          if (roomExists) return old
          
          return [roomsUpdated.room, ...old]
        })
      }
    }
  }, [roomsUpdated, queryClient])

  return query
}


export const useRoomMessages = (roomId: string | null) => {
  const queryClient = useQueryClient()
  
 
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
    staleTime: 1 * 60 * 1000, 
  })

 
  useEffect(() => {
    if (newMessage && roomId) {
      queryClient.setQueryData(['room-messages', roomId], (old: any) => {
        if (!old?.messages) return old
        
        const messageExists = old.messages.some((msg: any) => 
          msg.id === newMessage.id || 
          (msg.id.startsWith('temp-') && msg.content === newMessage.content)
        )
        
        if (messageExists) {
          const filteredMessages = old.messages.filter((msg: any) => 
            !(msg.id.startsWith('temp-') && msg.content === newMessage.content)
          )
          return {
            ...old,
            messages: [...filteredMessages, newMessage]
          }
        }
        
        return {
          ...old,
          messages: [...old.messages, newMessage]
        }
      })

 
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


  useEffect(() => {
    if (roomUpdated && roomId) {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    }
  }, [roomUpdated, roomId, queryClient])

  return query
}


export const useAvailableUsers = () => {
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const { data: rooms } = useChatRooms()

  const getAvailableUsers = (allUsers: any[]) => {
    if (!rooms || !allUsers.length) return allUsers

    
    const existingChatUserIds = new Set()
    rooms.forEach((room: any) => {
      room.participants.forEach((participant: any) => {
        existingChatUserIds.add(participant.user.id)
      })
    })

    
    return allUsers.filter((user: any) => !existingChatUserIds.has(user.id))
  }

  const updateAvailableUsers = (users: any[]) => {
    setAvailableUsers(getAvailableUsers(users))
  }

  return {
    availableUsers,
    updateAvailableUsers,
    getAvailableUsers
  }
}


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
      await queryClient.cancelQueries({ queryKey: ['room-messages', variables.roomId] })

      const previousMessages = queryClient.getQueryData(['room-messages', variables.roomId])

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

      queryClient.setQueryData(['room-messages', variables.roomId], (old: any) => {
        if (!old?.messages) return { messages: [tempMessage], nextCursor: null }
        
        const filteredMessages = old.messages.filter((msg: any) => 
          !(msg.id.startsWith('temp-') && msg.content === variables.content)
        )
        return {
          ...old,
          messages: [...filteredMessages, tempMessage]
        }
      })

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
      if (context?.previousMessages) {
        queryClient.setQueryData(['room-messages', variables.roomId], context.previousMessages)
      }
    },
    onSettled: (data, error, variables) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: ['room-messages', variables.roomId] })
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      }
    },
  })
}


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
    onSuccess: (data) => {
     
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      
 
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!old) return [data]
        return [data, ...old]
      })
    },
  })
}

// Mark messages as read
export const useMarkAsRead = () => {
   const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}


export const useRoomUpdates = () => {
  const queryClient = useQueryClient()
  
 
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
   
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user')
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserId(userData.id)
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error)
      }
    }
    
    fetchCurrentUser()
  }, [])

 
  const userChannelName = currentUserId ? `user-${currentUserId}` : null
  const roomCreated = usePusher(userChannelName, 'room-created')
  
  
  const companyChannelName = currentUserId ? `company-${currentUserId}` : null 
  const companyRoomCreated = usePusher(companyChannelName, 'room-created')

  useEffect(() => {
    if (roomCreated) {
      // console.log('Real-time room created (user channel):', roomCreated)
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!old) return [roomCreated]
        
        const roomExists = old.some((room: any) => room.id === roomCreated.id)
        if (roomExists) return old
        
        return [roomCreated, ...old]
      })
    }
  }, [roomCreated, queryClient])

  useEffect(() => {
    if (companyRoomCreated) {
      // console.log('Real-time room created (company channel):', companyRoomCreated)
      queryClient.setQueryData(['chat-rooms'], (old: any) => {
        if (!old) return [companyRoomCreated]
        
        const roomExists = old.some((room: any) => room.id === companyRoomCreated.id)
        if (roomExists) return old
        
        return [companyRoomCreated, ...old]
      })
    }
  }, [companyRoomCreated, queryClient])


  const useRoomUpdatesGeneric = () => {
    const queryClient = useQueryClient()
    
    
    const roomCreatedUser = usePusher('room-updates-user', 'room-created')
    const roomCreatedCompany = usePusher('room-updates-company', 'room-created')

    useEffect(() => {
      if (roomCreatedUser) {
        // console.log('Real-time room created (generic user):', roomCreatedUser)
        queryClient.setQueryData(['chat-rooms'], (old: any) => {
          if (!old) return [roomCreatedUser]
          
          const roomExists = old.some((room: any) => room.id === roomCreatedUser.id)
          if (roomExists) return old
          
          return [roomCreatedUser, ...old]
        })
      }
    }, [roomCreatedUser, queryClient])

    useEffect(() => {
      if (roomCreatedCompany) {
        // console.log('Real-time room created (generic company):', roomCreatedCompany)
        queryClient.setQueryData(['chat-rooms'], (old: any) => {
          if (!old) return [roomCreatedCompany]
          
          const roomExists = old.some((room: any) => room.id === roomCreatedCompany.id)
          if (roomExists) return old
          
          return [roomCreatedCompany, ...old]
        })
      }
    }, [roomCreatedCompany, queryClient])
  }

  return useRoomUpdatesGeneric
}