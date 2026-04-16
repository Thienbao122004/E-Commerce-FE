export interface AiChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export interface ProductToAdd {
  productId?: string
  variantId?: string
  quantity: number
}

export interface ProductSuggestion {
  id: string
  slug?: string
  name: string
  basePrice: number
  imageUrl?: string
  categoryName?: string
  matchScore?: number
  matchReason?: string
}

export interface AiChatSessionResponse {
  sessionId: string
  status: string
  history: AiChatMessage[]
}

export interface AiChatSendResponse {
  reply: string
  intent: string
  products: ProductSuggestion[]
  needsConfirmation: boolean
  cartUpdated: boolean
  cartId?: string
  sessionId: string
  productToAdd?: ProductToAdd | null
}

export interface AiChatConfirmOrderResponse {
  success: boolean
  orderId?: string
  message: string
}

export interface AiSessionSummary {
  sessionId: string
  status: string
  createdAt?: string
  updatedAt?: string
  isMuted?: boolean
  unreadCount?: number
  title: string
  lastMessage?: {
    role: string
    content: string
    createdAt?: string
  } | null
  messageCount: number
}

export interface AiSessionsResponse {
  success: boolean
  sessions: AiSessionSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export interface AiSessionMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export interface AiSessionMessagesResponse {
  success: boolean
  sessionId: string
  messages: AiSessionMessage[]
}
