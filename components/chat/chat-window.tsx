/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, MessageCircle, MoreHorizontal, Users } from 'lucide-react'
import { useRoomMessages, useSendMessage } from '@/hooks/useChat'
import { User, ChatRoom, ChatWindowProps } from '@/types/chat'

// Utility functions
const getUserDisplayName = (user: User) => {
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatMessageTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function ChatWindow({ room, currentUser, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  
  const { data: messagesData, isLoading, error } = useRoomMessages(room?.id || null)
  const sendMessageMutation = useSendMessage()

  const messages = messagesData?.messages || []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, isAtBottom])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(isBottom)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || !newMessage.trim() || sendMessageMutation.isPending) return

    const content = newMessage.trim()
    setNewMessage('')

    try {
      await onSendMessage(room.id, content)
      setIsAtBottom(true)
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
    }
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <div className="text-center text-muted-foreground max-w-sm mx-auto p-6">
          <div className="relative mb-4">
            <MessageCircle className="h-16 w-16 mx-auto text-primary/30" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a Chat</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    )
  }

  const otherParticipants = room.participants.filter((p: any) => p.user.id !== currentUser.id)
  const roomDisplayName = room.isGroup 
    ? room.name
    : getUserDisplayName(otherParticipants[0]?.user) || 'Unknown'

  const participantCount = room.participants.length

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Compact Header */}
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {room.isGroup ? (
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs">
                  <Users className="h-4 w-4" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={otherParticipants[0]?.user?.image || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                    {getInitials(roomDisplayName)}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm text-foreground">{roomDisplayName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-muted-foreground">
                  {room.isGroup ? `${participantCount} members` : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20"
        onScroll={handleScroll}
      >
        <div className="p-4 min-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading messages...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-destructive">
                <p className="text-sm">Failed to load messages</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {messages.map((message: any, index: number) => {
                const isCurrentUser = message.sender.id === currentUser.id || message.sender.id === 'temp'
                const showAvatar = !isCurrentUser && (
                  index === messages.length - 1 || 
                  messages[index + 1]?.sender.id !== message.sender.id
                )

                const showTimestamp = index === messages.length - 1 || 
                  new Date(message.createdAt).getTime() - new Date(messages[index + 1]?.createdAt).getTime() > 300000

                const isTempMessage = message.id.startsWith('temp-')

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 group ${
                      isCurrentUser ? 'flex-row-reverse' : ''
                    } ${isTempMessage ? 'opacity-70' : ''}`}
                  >
                    {/* Avatar for received messages */}
                    {showAvatar && !isCurrentUser && (
                      <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                        <AvatarImage src={message.sender.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                          {getInitials(getUserDisplayName(message.sender))}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Spacer for alignment when no avatar */}
                    {(!showAvatar && !isCurrentUser) && (
                      <div className="w-6 flex-shrink-0"></div>
                    )}

                    {/* Message bubble - ALWAYS show current user on right */}
                    <div className={`flex flex-col max-w-[75%] ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`
                        relative rounded-2xl px-3 py-2 transition-all duration-150
                        ${isCurrentUser
                          ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm'
                          : 'bg-card text-card-foreground rounded-bl-md border border-border shadow-sm'
                        }
                        ${isTempMessage ? 'animate-pulse' : ''}
                      `}>
                        <p className="text-sm  leading-relaxed break-words">{message.content}</p>
                      </div>
                      
                      {/* Timestamp */}
                      {showTimestamp && (
                        <div className={`flex items-center gap-1 mt-1 px-1 ${
                          isCurrentUser ? 'flex-row-reverse' : ''
                        }`}>
                          <span className="text-xs text-muted-foreground">
                            {isTempMessage ? 'Sending...' : formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="max-w-sm mx-auto">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-2">No messages yet</h3>
                    <p className="text-muted-foreground text-xs">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Compact Message Input */}
      <div className="border-t border-border bg-card/50 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
          <div className="flex-1 bg-background rounded-xl px-3 py-2 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-150">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sendMessageMutation.isPending}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-h-[20px] text-sm placeholder:text-muted-foreground"
            />
          </div>
          <Button 
            type="submit" 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            size="icon"
            className="rounded-xl w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-150 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground flex-shrink-0"
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