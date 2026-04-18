import type { MessageDto } from "@/types/conversation"

export function sortMessagesChronological(messages: MessageDto[]): MessageDto[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}
