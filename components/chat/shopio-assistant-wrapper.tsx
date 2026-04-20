"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

const ShopioAssistantWidget = dynamic(
  () => import("@/components/chat/shopio-assistant-widget").then((m) => m.ShopioAssistantWidget),
  { ssr: false }
)

export function ShopioAssistantWrapper() {
  const pathname = usePathname()
  const { role } = useAuth()

  const hideWidget =
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/user/ai-chat") ||
    pathname?.startsWith("/login") ||
    (pathname === "/" && (role === "seller" || role === "admin"))

  if (hideWidget) return null

  return <ShopioAssistantWidget />
}
