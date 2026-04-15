"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

const ChatWidget = dynamic(
  () => import("@/components/chat/chat-widget").then((m) => m.ChatWidget),
  { ssr: false }
)

export function ChatWidgetWrapper() {
  const pathname = usePathname()
  const hideWidget = pathname?.startsWith("/seller") || pathname?.startsWith("/admin")

  if (hideWidget) return null

  return <ChatWidget />
}
