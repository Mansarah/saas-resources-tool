/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, MessageCircle, MoreVertical } from 'lucide-react'
import { useRoomMessages, useSendMessage } from '@/hooks/useChat'
import { User, ChatRoom, ChatWindowProps } from '@/types/chat'

// Move function outside component
const getUserDisplayName = (user: User) => {
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
}

export function ChatWindow({ room, currentUser, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: messagesData, isLoading } = useRoomMessages(room?.id || null)
  const sendMessageMutation = useSendMessage()

  const messages = messagesData?.messages || []

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || !newMessage.trim()) return

    const content = newMessage.trim()
    setNewMessage('')

    try {
      await sendMessageMutation.mutateAsync({
        roomId: room.id,
        content
      })
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message if failed
      setNewMessage(content)
    }
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <div className="text-center text-muted-foreground">
          <div className="relative mb-4">
            <MessageCircle className="h-16 w-16 mx-auto text-primary/40" />
            <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">Select a chat</h3>
          <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const otherParticipants = room.participants.filter((p: { user: User }) => p.user.id !== currentUser.id)
  const roomDisplayName = room.isGroup 
    ? room.name
    : getUserDisplayName(otherParticipants[0]?.user) || 'Unknown'

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat header */}
      <div className="border-b bg-background/95 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
              <AvatarImage src={
                room.isGroup 
                  ? '' 
                  : otherParticipants[0]?.user.image || ''
              } />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium text-sm">
                {roomDisplayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{roomDisplayName}</h3>
              <p className="text-xs text-green-600 font-medium">
                {room.isGroup 
                  ? `${room.participants.length} participants • Online`
                  : 'Online'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-primary/5 to-muted/30">
        <div className="p-4 min-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading messages...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message: any, index: number) => {
                const isCurrentUser = message.sender.id === currentUser.id
                const showAvatar = !isCurrentUser && (
                  index === messages.length - 1 || 
                  messages[index + 1]?.sender.id !== message.sender.id
                )

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 group ${
                      isCurrentUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar for received messages */}
                    {showAvatar && !isCurrentUser && (
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                        <AvatarImage src={message.sender.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                          {getUserDisplayName(message.sender).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Spacer for alignment when no avatar */}
                    {(!showAvatar && !isCurrentUser) && (
                      <div className="w-7 flex-shrink-0"></div>
                    )}

                    {/* Message bubble */}
                    <div className={`flex flex-col max-w-[75%] ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`
                        relative rounded-2xl px-3 py-2 transition-all duration-200
                        ${isCurrentUser
                          ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm'
                          : 'bg-card text-card-foreground rounded-bl-md shadow-sm border border-border'
                        }
                        group-hover:shadow-md
                      `}>
                        <p className="text-sm break-words leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`flex items-center gap-1 mt-1 px-1 ${
                        isCurrentUser ? 'flex-row-reverse' : ''
                      }`}>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-sm mx-auto">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Send a message to start the conversation with {roomDisplayName}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex-1 bg-muted rounded-2xl px-3 py-2 border border-border focus-within:border-primary focus-within:bg-background transition-colors">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sendMessageMutation.isPending}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-h-[20px] text-sm"
            />
          </div>
          <Button 
            type="submit" 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            size="icon"
            className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}