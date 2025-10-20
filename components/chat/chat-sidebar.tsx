/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Search, Users, MessageCircle, Plus } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { useChatRooms } from '@/hooks/useChat'
import { User, ChatRoom, ChatSidebarProps } from '@/types/chat'

export function ChatSidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
  onCreateRoom,
  currentUser,
  companyUsers
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  const { data: roomsData } = useChatRooms()
  const displayedRooms = roomsData || rooms

  // Listen for new messages in all rooms to update unread counts
  useEffect(() => {
    const channels = displayedRooms.map((room: ChatRoom) => `chat-${room.id}`)
    
    channels.forEach((channelName: string) => {
      const channel = pusherClient.subscribe(channelName)
      
      channel.bind('new-message', (data: any) => {
        if (selectedRoom?.id !== data.roomId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: (prev[data.roomId] || 0) + 1
          }))
        }
      })
    })

    return () => {
      channels.forEach((channelName: string) => {
        pusherClient.unsubscribe(channelName)
      })
    }
  }, [displayedRooms, selectedRoom])

  const handleRoomSelect = (room: ChatRoom) => {
    onSelectRoom(room)
    setUnreadCounts(prev => ({
      ...prev,
      [room.id]: 0
    }))
  }

  const filteredRooms = displayedRooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants.some((p: { user: User }) => 
      getUserDisplayName(p.user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleCreateRoom = (participantIds: string[], name?: string) => {
    onCreateRoom(participantIds, name)
    setSelectedUsers([])
    setSearchTerm('')
  }

  const getUserDisplayName = (user: User) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  }

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.messages || room.messages.length === 0) {
      return 'Start a conversation'
    }
    
    const lastMessage = room.messages[0]
    const senderName = lastMessage.sender?.name || 'Someone'
    const message = lastMessage.content.length > 25 
      ? lastMessage.content.substring(0, 25) + '...' 
      : lastMessage.content
      
    return `${senderName}: ${message}`
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else {
      return `${Math.floor(diffInHours / 24)}d`
    }
  }

  return (
    <div className="w-full md:w-80 border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <NewChatDialog
            users={companyUsers}
            currentUser={currentUser}
            onCreateRoom={handleCreateRoom}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.map((room: ChatRoom) => {
            const otherParticipants = room.participants.filter((p: { user: User }) => p.user.id !== currentUser.id)
            const roomDisplayName = room.isGroup 
              ? room.name
              : getUserDisplayName(otherParticipants[0]?.user) || 'Unknown'

            const unreadCount = unreadCounts[room.id] || 0
            const isSelected = selectedRoom?.id === room.id

            return (
              <div
                key={room.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mx-2
                  ${isSelected 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarImage src={
                      room.isGroup 
                        ? '' 
                        : otherParticipants[0]?.user.image || ''
                    } />
                    <AvatarFallback className={`
                      ${room.isGroup 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-br from-green-500 to-green-600'
                      } text-white font-medium
                    `}>
                      {room.isGroup 
                        ? <Users className="h-5 w-5" />
                        : roomDisplayName.charAt(0).toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white shadow-sm animate-pulse"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {roomDisplayName}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {getTimeAgo(room.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 truncate flex-1">
                      {getLastMessagePreview(room)}
                    </p>
                    {room.isGroup && (
                      <Badge variant="secondary" className="text-xs px-2 py-0 bg-blue-100 text-blue-700">
                        Group
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredRooms.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations</h3>
              <p className="text-gray-500 text-sm mb-4">Start a new chat to begin messaging</p>
              <NewChatDialog
                users={companyUsers}
                currentUser={currentUser}
                onCreateRoom={handleCreateRoom}
                trigger={
                  <Button className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// New Chat Dialog Component
function NewChatDialog({ 
  users, 
  currentUser, 
  onCreateRoom,
  trigger
}: { 
  users: User[]
  currentUser: User
  onCreateRoom: (participantIds: string[], name?: string) => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  const filteredUsers = users.filter(
    (user: User) => 
      user.id !== currentUser.id &&
      !selectedUsers.find((selected: User) => selected.id === user.id) &&
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getUserDisplayName = (user: User) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  }

  const handleCreateRoom = () => {
    if (selectedUsers.length > 0) {
      const participantIds = selectedUsers.map((user: User) => user.id)
      const roomName = selectedUsers.length === 1 
        ? getUserDisplayName(selectedUsers[0])
        : `${selectedUsers.map((u: User) => getUserDisplayName(u)).join(', ')}`
      
      onCreateRoom(participantIds, roomName)
      setSelectedUsers([])
      setSearchTerm('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm">
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-semibold">New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search colleagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user: User) => (
                  <Badge key={user.id} className="flex items-center gap-1 py-1.5 px-3 bg-blue-100 text-blue-800 border-blue-200">
                    {getUserDisplayName(user)}
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter((u: User) => u.id !== user.id))}
                      className="ml-1 hover:text-blue-600 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Button 
                onClick={handleCreateRoom} 
                size="sm" 
                className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Start Chat {selectedUsers.length > 1 && `(${selectedUsers.length})`}
              </Button>
            </div>
          )}

          {/* Users List */}
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                  onClick={() => setSelectedUsers(prev => [...prev, user])}
                >
                  <Avatar className="h-10 w-10 ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                      {getUserDisplayName(user).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800">{getUserDisplayName(user)}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize bg-gray-100 text-gray-700">
                    {user.role.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}