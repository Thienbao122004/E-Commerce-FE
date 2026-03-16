import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001"

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

export const aiChatService = {
  getOrCreateSession: () =>
    aiRequest<AiChatSessionResponse>("/api/ai/chat/session", { method: "POST" }),

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
}
