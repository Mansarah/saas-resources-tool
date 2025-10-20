export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  firstName?: string
  lastName?: string
}

export interface ChatRoom {
  id: string
  name: string
  isGroup: boolean
  participants: {
    user: User
  }[]
  messages: Array<{
    content: string
    sender: {
      name: string | null
    }
  }>
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