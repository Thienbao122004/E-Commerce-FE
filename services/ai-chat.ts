import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

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

async function aiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? "AI chat request failed")
  }

  return res.json() as Promise<T>
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? "Request failed")
  }

  return res.json() as Promise<T>
}

export const aiChatService = {
  // ── Python AI service ──────────────────────────────────────────────────────
  getOrCreateSession: () =>
    aiRequest<AiChatSessionResponse>("/api/ai/chat/session", { method: "POST" }),

  createNewSession: () =>
    aiRequest<AiChatSessionResponse>("/api/ai/chat/session/new", { method: "POST" }),

  getHistory: (sessionId: string) =>
    aiRequest<AiChatSessionResponse>(`/api/ai/chat/history/${sessionId}`, { method: "GET" }),

  sendMessage: (sessionId: string, message: string) =>
    aiRequest<AiChatSendResponse>("/api/ai/chat/send", {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    }),

  confirmOrder: (sessionId: string, cartId: string, shippingAddressId: string) =>
    aiRequest<AiChatConfirmOrderResponse>("/api/ai/chat/confirm-order", {
      method: "POST",
      body: JSON.stringify({ sessionId, cartId, shippingAddressId }),
    }),

  // ── ECommerceAPI (đọc lịch sử từ DB) ──────────────────────────────────────
  listSessions: (page = 1, pageSize = 20) =>
    apiRequest<AiSessionsResponse>(`/api/ai/sessions?page=${page}&pageSize=${pageSize}`),

  getSessionMessages: (sessionId: string) =>
    apiRequest<AiSessionMessagesResponse>(`/api/ai/sessions/${sessionId}/messages`),

  markSessionRead: (sessionId: string) =>
    apiRequest<{ success: boolean; sessionId: string; unreadCount: number }>(
      `/api/ai/sessions/${sessionId}/read`,
      { method: "POST" }
    ),

  setSessionMuted: (sessionId: string, isMuted: boolean) =>
    apiRequest<{ success: boolean; sessionId: string; isMuted: boolean }>(
      `/api/ai/sessions/${sessionId}/mute`,
      {
        method: "PATCH",
        body: JSON.stringify({ isMuted }),
      }
    ),

  deleteSession: (sessionId: string) =>
    apiRequest<{ success: boolean; sessionId: string }>(`/api/ai/sessions/${sessionId}`, {
      method: "DELETE",
    }),
}
