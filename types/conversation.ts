export interface MessageDto {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: "buyer" | "seller"
  messageType: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface ConversationDto {
  id: string
  shopId: string
  shopName: string
  shopLogoUrl: string | null
  buyerId: string
  buyerName: string
  buyerAvatarUrl?: string | null
  sellerId: string
  orderId: string | null
  lastMessage: MessageDto | null
  unreadCount: number
  createdAt: string
  /** Từ API: đã tắt thông báo (theo user đang đăng nhập). */
  isMuted?: boolean
}

export interface ConversationDetailDto {
  conversation: ConversationDto
  messages: MessageDto[]
  totalMessages: number
  page: number
  pageSize: number
}
