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
import { Search, Users, MessageCircle, Plus, UserPlus, Loader2 } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { useChatRooms } from '@/hooks/useChat'
import { User, ChatRoom, ChatSidebarProps } from '@/types/chat'

// Utility functions
const getUserDisplayName = (user: User) => {
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
  return `${Math.floor(diffInMinutes / 1440)}d`
}

export function ChatSidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
  onCreateRoom,
  currentUser,
  companyUsers
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>({})

  const { data: roomsData } = useChatRooms()
  const displayedRooms = roomsData || rooms

  // Real-time unread counts - only show for unread messages when room is not selected
  useEffect(() => {
    displayedRooms.forEach((room: ChatRoom) => {
      const channel = pusherClient.subscribe(`chat-${room.id}`)
      
      channel.bind('new-message', (data: any) => {
        // Only increment unread count if:
        // 1. This room is not currently selected AND
        // 2. The message was sent after the last time user read this room
        const lastReadTime = lastReadTimes[room.id]
        const messageTime = new Date(data.createdAt).getTime()
        const isUnread = !lastReadTime || messageTime > new Date(lastReadTime).getTime()
        
        if (selectedRoom?.id !== room.id && isUnread) {
          setUnreadCounts(prev => ({
            ...prev,
            [room.id]: (prev[room.id] || 0) + 1
          }))
        }
      })

      return () => {
        channel.unbind('new-message')
        pusherClient.unsubscribe(`chat-${room.id}`)
      }
    })
  }, [displayedRooms, selectedRoom, lastReadTimes])

  const handleRoomSelect = (room: ChatRoom) => {
    onSelectRoom(room)
    // Mark as read when selected - clear notification
    setUnreadCounts(prev => ({
      ...prev,
      [room.id]: 0
    }))
    // Update last read time to current time
    setLastReadTimes(prev => ({
      ...prev,
      [room.id]: new Date().toISOString()
    }))
  }

  const filteredRooms = displayedRooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants.some((p: any) => 
      getUserDisplayName(p.user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.messages || room.messages.length === 0) {
      return 'No messages yet'
    }
    
    const lastMessage = room.messages[0]
    const message = lastMessage.content.length > 30 
      ? lastMessage.content.substring(0, 30) + '...' 
      : lastMessage.content
      
    return message
  }

  // const getRoomDisplayInfo = (room: ChatRoom) => {
  //   const otherParticipants = room.participants.filter((p: any) => p.user.id !== currentUser.id)
    
  //   if (room.isGroup) {
  //     return {
  //       name: room.name,
  //      participants: room.participants.map(p => p.user),
  //       isGroup: true
  //     }
  //   }
    
  //   const otherUser = otherParticipants[0]?.user
  //   return {
  //     name: getUserDisplayName(otherUser) || 'Unknown',
  //     participants: [otherUser],
  //     isGroup: false
  //   }
  // }
const getRoomDisplayInfo = (room: ChatRoom) => {
  // Exclude current user
  const otherUsers = room.participants
    .filter((p) => p.user.id !== currentUser.id)
    .map((p) => p.user) // <-- extract User

  if (room.isGroup) {
    return {
      name: room.name,
      participants: room.participants.map(p => p.user), // all users for group
      isGroup: true
    }
  }

  const otherUser = otherUsers[0] // single user in 1:1 chat
  return {
    name: getUserDisplayName(otherUser) || 'Unknown',
    participants: [otherUser],
    isGroup: false
  }
}

  return (
    <div className="w-full md:w-80 border-r bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Chats</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredRooms.length} conversations</p>
          </div>
          <NewChatDialog
            users={companyUsers}
            currentUser={currentUser}
            onCreateRoom={onCreateRoom}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border h-9 text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredRooms.map((room: ChatRoom) => {
            const roomInfo = getRoomDisplayInfo(room)
            // Don't show notification for currently selected room
            const unreadCount = selectedRoom?.id === room.id ? 0 : (unreadCounts[room.id] || 0)
            const isSelected = selectedRoom?.id === room.id
            const lastMessage = room.messages?.[0]
            const lastMessageTime = lastMessage ? getTimeAgo(lastMessage.createdAt) : null

            return (
              <div
                key={room.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border
                  ${isSelected 
                    ? 'bg-purple-600/80 border-primary shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-accent'
                  }
                `}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className={`h-10 w-10 ${isSelected ? 'ring-2 ring-primary-foreground/20' : ''}`}>
                    {roomInfo.isGroup ? (
                      <>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs">
                          <Users className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={roomInfo.participants[0]?.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                          {getInitials(roomInfo.name)}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  {unreadCount > 0 && (
                    <Badge 
                      className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs border-2 ${
                        isSelected ? 'bg-primary-foreground text-primary border-primary' : 'bg-red-500 text-white border-background'
                      }`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium text-sm truncate ${
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {roomInfo.name}
                    </p>
                    {lastMessageTime && (
                      <span className={`text-xs ${
                        isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {lastMessageTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className={`text-xs truncate flex-1 ${
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {getLastMessagePreview(room)}
                    </p>
                    {roomInfo.isGroup && (
                      <Badge variant="secondary" className="text-xs h-4 px-1 bg-primary/20 text-primary border-0">
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
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-2">No conversations</h3>
              <p className="text-muted-foreground text-xs mb-4">Start a new chat to begin messaging</p>
              <NewChatDialog
                users={companyUsers}
                currentUser={currentUser}
                onCreateRoom={onCreateRoom}
                trigger={
                  <Button className="bg-primary hover:bg-primary/90 hover:cursor-pointer text-primary-foreground h-8 text-xs rounded-lg">
                    <Plus className="h-3 w-3 mr-1" />
                    New Chat
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
  const [roomName, setRoomName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredUsers = users.filter(
    (user: User) => 
      user.id !== currentUser.id &&
      !selectedUsers.find((selected: User) => selected.id === user.id) &&
      (getUserDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateRoom = async () => {
    if (selectedUsers.length > 0) {
      setIsCreating(true)
      setError(null)
      
      try {
        const participantIds = selectedUsers.map((user: User) => user.id)
        const name = selectedUsers.length > 1 ? roomName || `${selectedUsers.map(u => getUserDisplayName(u)).join(', ')}` : undefined
        
        await onCreateRoom(participantIds, name)
        
        // Reset form and close dialog on success
        setSelectedUsers([])
        setSearchTerm('')
        setRoomName('')
        setOpen(false)
      } catch (error) {
        console.error('Failed to create chat room:', error)
        setError('Failed to create chat room. Please try again.')
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    // Reset form when dialog closes
    if (!isOpen) {
      setSelectedUsers([])
      setSearchTerm('')
      setRoomName('')
      setError(null)
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" className="rounded-lg w-8 h-8 p-0 bg-primary hover:cursor-pointer hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border border-border rounded-lg bg-card shadow-xl max-h-[80vh]">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-semibold">New Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search colleagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border h-9 text-sm rounded-lg"
              disabled={isCreating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-medium text-primary">Selected participants:</p>
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user: User) => (
                  <Badge key={user.id} className="flex items-center gap-1 py-1 px-2 bg-primary text-primary-foreground border-0 rounded-md text-xs">
                    {getUserDisplayName(user)}
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter((u: User) => u.id !== user.id))}
                      className="ml-0.5 hover:text-primary-foreground/80 transition-colors text-xs"
                      disabled={isCreating}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              
              {selectedUsers.length > 1 && (
                <Input
                  placeholder="Group name (optional)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-background border-border h-8 text-sm rounded-lg"
                  disabled={isCreating}
                />
              )}
              
              <Button 
                onClick={handleCreateRoom} 
                size="sm" 
                disabled={isCreating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-sm rounded-lg disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Start Chat ${selectedUsers.length > 1 ? `(${selectedUsers.length})` : ''}`
                )}
              </Button>
            </div>
          )}

          {/* Users List */}
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No users found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredUsers.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                    onClick={() => {
                      if (!isCreating) {
                        setSelectedUsers(prev => [...prev, user])
                      }
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                        {getInitials(getUserDisplayName(user))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{getUserDisplayName(user)}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize bg-background text-muted-foreground rounded-md px-1.5">
                      {user.role.toLowerCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Help Text */}
          {selectedUsers.length === 0 && (
            <div className="text-center py-4">
              <UserPlus className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Select users to start a chat</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}