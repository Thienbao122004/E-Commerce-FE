import { api } from "@/lib/api-client"
import type {
  MessageDto,
  ConversationDto,
  ConversationDetailDto,
} from "@/types/conversation"

export type { MessageDto, ConversationDto, ConversationDetailDto } from "@/types/conversation"

export async function fetchConversations(): Promise<ConversationDto[]> {
  const json = await api.get<{ data: ConversationDto[] }>("/api/conversations")
  return json.data ?? []
}

export async function fetchMessages(
  conversationId: string,
  page = 1,
  pageSize = 30
): Promise<ConversationDetailDto> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const json = await api.get<{ data: ConversationDetailDto }>(
    `/api/conversations/${conversationId}/messages?${params}`
  )
  return json.data
}

export async function sendMessage(
  conversationId: string,
  content: string,
  messageType = "text"
): Promise<MessageDto> {
  const json = await api.post<{ data: MessageDto }>(
    `/api/conversations/${conversationId}/messages`,
    { content, messageType }
  )
  return json.data
}

export async function startOrGetConversation(
  shopId: string,
  orderId?: string,
  firstMessage?: string
): Promise<ConversationDto> {
  const json = await api.post<{ data: ConversationDto }>(
    "/api/conversations",
    { shopId, orderId, firstMessage }
  )
  return json.data
}

export function markAsRead(conversationId: string): Promise<void> {
  return api.put(`/api/conversations/${conversationId}/read`)
}

export function setConversationMuted(conversationId: string, muted: boolean): Promise<void> {
  return api.put(`/api/conversations/${conversationId}/mute`, { muted })
}

export function hideConversationForUser(conversationId: string): Promise<void> {
  return api.post(`/api/conversations/${conversationId}/hide`)
}
