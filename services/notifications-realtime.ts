import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr"

/**
 * Lắng nghe SignalR cùng hub order-tracking — khi có thông báo mới, server gửi NotificationsUpdated.
 */
export function createNotificationsRealtimeConnection(
  token: string | undefined,
  onNotificationsUpdated: () => void
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

  connection.on("NotificationsUpdated", onNotificationsUpdated)
  return connection
}

export async function startNotificationsRealtimeConnection(
  connection: HubConnection | null
): Promise<void> {
  if (!connection) return
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await connection.start()
      return
    } catch {
      if (attempt === 5) return
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }
}

export async function disposeNotificationsRealtimeConnection(
  connection: HubConnection | null
): Promise<void> {
  if (!connection) return
  connection.off("NotificationsUpdated")
  await connection.stop()
}
