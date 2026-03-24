const API = process.env.NEXT_PUBLIC_API_URL

// ─── Types ──────────────────────────────────────────────────────────────────

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
  sellerId: string
  orderId: string | null
  lastMessage: MessageDto | null
  unreadCount: number
  createdAt: string
}

export interface ConversationDetailDto {
  conversation: ConversationDto
  messages: MessageDto[]
  totalMessages: number
  page: number
  pageSize: number
}

// ─── API ────────────────────────────────────────────────────────────────────

export async function fetchConversations(token: string): Promise<ConversationDto[]> {
  const res = await fetch(`${API}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách hội thoại")
  const json = await res.json()
  return json.data ?? []
}

export async function fetchMessages(
  token: string,
  conversationId: string,
  page = 1,
  pageSize = 30
): Promise<ConversationDetailDto> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await fetch(`${API}/api/conversations/${conversationId}/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải tin nhắn")
  const json = await res.json()
  return json.data
}

export async function sendMessage(
  token: string,
  conversationId: string,
  content: string,
  messageType = "text"
): Promise<MessageDto> {
  const res = await fetch(`${API}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, messageType }),
  })
  if (!res.ok) throw new Error("Lỗi gửi tin nhắn")
  const json = await res.json()
  return json.data
}

export async function startOrGetConversation(
  token: string,
  shopId: string,
  orderId?: string,
  firstMessage?: string
): Promise<ConversationDto> {
  const res = await fetch(`${API}/api/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shopId, orderId, firstMessage }),
  })
  if (!res.ok) throw new Error("Lỗi tạo hội thoại")
  const json = await res.json()
  return json.data
}

export async function markAsRead(token: string, conversationId: string): Promise<void> {
  const res = await fetch(`${API}/api/conversations/${conversationId}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi đánh dấu đã đọc")
}
