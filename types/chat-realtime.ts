import type { MessageDto } from "./conversation"

export type ChatMessageReceivedPayload = {
  conversationId?: string
  message?: MessageDto
}
