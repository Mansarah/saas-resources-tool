/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, MessageCircle, MoreVertical } from 'lucide-react'
import { useRoomMessages, useSendMessage } from '@/hooks/useChat'
import { User, ChatRoom, ChatWindowProps } from '@/types/chat'

export function ChatWindow({ room, currentUser, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const { data: messagesData, isLoading } = useRoomMessages(room?.id || null)
  const sendMessageMutation = useSendMessage()

  const messages = messagesData?.messages || []

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
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
      // Optionally show error to user
    }
  }

  const getUserDisplayName = (user: User) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center text-muted-foreground">
          <div className="relative mb-4">
            <MessageCircle className="h-16 w-16 mx-auto text-blue-400/60" />
            <div className="absolute inset-0 bg-blue-400/10 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Select a chat</h3>
          <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const otherParticipants = room.participants.filter((p: { user: User }) => p.user.id !== currentUser.id)
  const roomDisplayName = room.isGroup 
    ? room.name
    : getUserDisplayName(otherParticipants[0]?.user) || 'Unknown'

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50/20">
      {/* Chat header - Modern WhatsApp-like */}
      <div className="border-b bg-white/95 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
              <AvatarImage src={
                room.isGroup 
                  ? '' 
                  : otherParticipants[0]?.user.image || ''
              } />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                {roomDisplayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{roomDisplayName}</h3>
              <p className="text-xs text-green-600 font-medium">
                {room.isGroup 
                  ? `${room.participants.length} participants • Online`
                  : 'Online'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages area with WhatsApp-inspired background */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-gradient-to-b from-blue-50/30 to-gray-50/50 h-20">
        <div className="p-4 min-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center ">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading messages...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
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
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        <AvatarImage src={message.sender.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                          {getUserDisplayName(message.sender).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Spacer for alignment when no avatar */}
                    {(!showAvatar && !isCurrentUser) && (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    {/* Message bubble */}
                    <div className={`flex flex-col max-w-[70%] ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`
                        relative rounded-2xl px-4 py-2 transition-all duration-200
                        ${isCurrentUser
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-sm'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                        }
                        group-hover:shadow-md
                      `}>
                        <p className="text-sm break-words leading-relaxed">{message.content}</p>
                        
                        {/* Message status indicator for current user */}
                        {isCurrentUser && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`flex items-center gap-1 mt-1 px-1 ${
                        isCurrentUser ? 'flex-row-reverse' : ''
                      }`}>
                        <span className="text-xs text-gray-500">
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
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
                    <p className="text-gray-500 text-sm">
                      Send a message to start the conversation with {roomDisplayName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message input - Modern sticky footer */}
      <div className="border-t bg-white/95 backdrop-blur-sm p-4 shadow-inner">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-colors">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sendMessageMutation.isPending}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-h-[24px] resize-none"
            />
          </div>
          <Button 
            type="submit" 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            size="icon"
            className="rounded-full w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:bg-gray-400"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}