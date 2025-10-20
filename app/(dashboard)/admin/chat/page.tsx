/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatWindow } from '@/components/chat/chat-window'
import { Button } from '@/components/ui/button'
import { useChatRooms, useCreateRoom, useSendMessage } from '@/hooks/useChat'
import { User, ChatRoom } from '@/types/chat'

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use TanStack Query hooks
  const { data: rooms, isLoading: roomsLoading, error: roomsError } = useChatRooms()
  const createRoomMutation = useCreateRoom()
  const sendMessageMutation = useSendMessage()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setError(null)
      const [usersResponse, currentUserResponse] = await Promise.all([
        fetch('/api/admin/employees?chat=true'),
        fetch('/api/auth/current-user')
      ])

      if (!currentUserResponse.ok) throw new Error('Failed to fetch current user')

      const currentUserData = await currentUserResponse.json()
      setCurrentUser(currentUserData)

      // Handle users response
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        
        let users: User[] = []
        if (usersData.employees) {
          users = usersData.employees.map((emp: any) => ({
            id: emp.id,
            name: emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.firstName || emp.lastName || 'Unknown',
            email: emp.email,
            image: emp.image || null,
            role: emp.role || 'EMPLOYEE',
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department
          }))
        } else if (usersData.users) {
          users = usersData.users
        }
        
        setCompanyUsers(users)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async (participantIds: string[], name?: string) => {
    try {
      setError(null)
      await createRoomMutation.mutateAsync({
        participantIds,
        name,
        isGroup: participantIds.length > 1
      })
    } catch (error) {
      console.error('Error creating room:', error)
      setError('Failed to create chat room')
    }
  }

  const handleSendMessage = async (roomId: string, content: string) => {
    try {
      setError(null)
      await sendMessageMutation.mutateAsync({
        roomId,
        content
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
      throw error
    }
  }

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
  }

  // Combine loading states
  const isDataLoading = isLoading || roomsLoading
  const hasError = error || roomsError

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-destructive">
          <p>{error || (roomsError as Error)?.message || 'Failed to load chat data'}</p>
          <Button onClick={fetchUserData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <div>Loading chat...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p>Unable to load user data</p>
          <Button onClick={fetchUserData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg">
      <ChatSidebar
        rooms={rooms || []}
        selectedRoom={selectedRoom}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        currentUser={currentUser}
        companyUsers={companyUsers}
      />
      <ChatWindow
        room={selectedRoom}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}