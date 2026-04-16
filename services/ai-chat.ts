import { getAccessToken } from "@/lib/auth"

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

import type {
  AiChatSessionResponse,
  AiChatSendResponse,
  AiChatConfirmOrderResponse,
  AiSessionsResponse,
  AiSessionMessagesResponse,
} from "@/types/ai-chat"

export type {
  AiChatMessage,
  ProductToAdd,
  ProductSuggestion,
  AiChatSessionResponse,
  AiChatSendResponse,
  AiChatConfirmOrderResponse,
  AiSessionSummary,
  AiSessionsResponse,
  AiSessionMessage,
  AiSessionMessagesResponse,
} from "@/types/ai-chat"

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
