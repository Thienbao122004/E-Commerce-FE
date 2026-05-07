export interface AiChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
  /** Có khi BE đã lưu suggested_products_json (phiên bản mới). */
  products?: ProductSuggestion[]
}

export interface ProductToAdd {
  productId?: string
  variantId?: string
  quantity: number
}

export interface VariantSuggestion {
  id: string
  variantName: string
  /** Giá riêng biến thể (nếu có), ưu tiên hiển thị khi đã chọn phân loại */
  price?: number
}

export interface ProductSuggestion {
  id: string
  slug?: string
  name: string
  basePrice: number
  imageUrl?: string
  categoryName?: string
  /** Các phân loại (size, màu, …) — bắt buộc chọn khi thêm giỏ nếu có nhiều hơn 1 */
  variants?: VariantSuggestion[]
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
  products?: ProductSuggestion[]
}

export interface AiSessionMessagesResponse {
  success: boolean
  sessionId: string
  messages: AiSessionMessage[]
}
