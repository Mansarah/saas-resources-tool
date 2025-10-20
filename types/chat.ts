export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  firstName?: string
  lastName?: string
  department?: string
}

export interface ChatMessage {
  id: string
  content: string
  sender: User
  messageType: 'TEXT' | 'FILE' | 'SYSTEM'
  isEdited: boolean
  createdAt: string
  updatedAt: string
  roomId: string
}

export interface ChatParticipant {
  user: User
  joinedAt: string
  lastReadAt?: string
}

export interface ChatRoom {
  id: string
  name: string
  isGroup: boolean
  companyId: string
  participants: ChatParticipant[]
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatSidebarProps {
  rooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  onSelectRoom: (room: ChatRoom) => void
  onCreateRoom: (participantIds: string[], name?: string) => void
  currentUser: User
  companyUsers: User[]
}

export interface ChatWindowProps {
  room: ChatRoom | null
  currentUser: User
  onSendMessage: (roomId: string, content: string) => Promise<void>
}