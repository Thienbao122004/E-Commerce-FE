import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr"
import type { ConversationDto, MessageDto } from "@/types/conversation"
import type { ChatMessageReceivedPayload } from "@/types/chat-realtime"

export type { ChatMessageReceivedPayload } from "@/types/chat-realtime"
export type { ConversationDto, MessageDto } from "@/types/conversation"

type ChatRealtimeHandlers = {
  onConversationUpdated?: (conversation: ConversationDto) => void
  onChatMessageReceived?: (payload: ChatMessageReceivedPayload) => void
  onReconnected?: () => void
}

export function createChatRealtimeConnection(
  token: string | undefined,
  handlers: ChatRealtimeHandlers
): HubConnection | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!token || !apiUrl) return null
  const normalizedApiUrl = apiUrl.replace(/\/$/, "")

  const connection = new HubConnectionBuilder()
    .withUrl(`${normalizedApiUrl}/hubs/order-tracking`, {
      accessTokenFactory: () => token,
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
    .build()

  if (handlers.onConversationUpdated) {
    connection.on("ConversationUpdated", handlers.onConversationUpdated)
  }

  if (handlers.onChatMessageReceived) {
    connection.on("ChatMessageReceived", handlers.onChatMessageReceived)
  }

  if (handlers.onReconnected) {
    connection.onreconnected(() => handlers.onReconnected?.())
  }

  return connection
}

export async function startChatRealtimeConnection(connection: HubConnection | null): Promise<void> {
  if (!connection) return
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await connection.start()
      return
    } catch {
      if (attempt === 5) {
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }
}

export async function disposeChatRealtimeConnection(connection: HubConnection | null): Promise<void> {
  if (!connection) return
  connection.off("ConversationUpdated")
  connection.off("ChatMessageReceived")
  await connection.stop()
}
