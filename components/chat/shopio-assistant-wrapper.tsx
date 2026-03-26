"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

const ShopioAssistantWidget = dynamic(
  () => import("@/components/chat/shopio-assistant-widget").then((m) => m.ShopioAssistantWidget),
  { ssr: false }
)

export function ShopioAssistantWrapper() {
  const pathname = usePathname()
  const hideWidget =
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/user/ai-chat")

  if (hideWidget) return null

  return <ShopioAssistantWidget />
}
