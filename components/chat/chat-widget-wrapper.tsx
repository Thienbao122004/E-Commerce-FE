"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"

const ChatWidget = dynamic(
  () => import("@/components/chat/chat-widget").then((m) => m.ChatWidget),
  { ssr: false }
)

export function ChatWidgetWrapper() {
  const pathname = usePathname()
  const { role } = useAuth()

  const hideWidget =
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    (pathname === "/" && (role === "seller" || role === "admin"))

  if (hideWidget) return null

  return <ChatWidget />
}
