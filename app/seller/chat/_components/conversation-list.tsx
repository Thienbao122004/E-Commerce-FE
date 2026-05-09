"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatChatListTimeVN } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { IconDotsVertical, IconMessage2, IconSearch } from "@tabler/icons-react"
import type { ConversationDto } from "./chat-types"

function Avatar({ name, url, online, size = "md" }: { name: string; url?: string | null; online?: boolean; size?: "sm" | "md" }) {
  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    setImgError(false)
  }, [url])
  const colors = ["bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sizeClass = size === "sm" ? "size-8 text-xs" : "size-9 text-sm"
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div className="relative shrink-0">
      {url && !imgError ? (
        <div className={cn("rounded-full overflow-hidden", sizeClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="size-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className={cn("rounded-full flex items-center justify-center text-white font-semibold", color, sizeClass)}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
          online ? "bg-green-500" : "bg-muted-foreground/40"
        )} />
      )}
    </div>
  )
}

function getLastMessagePreview(conversation: ConversationDto): string {
  const lastMessage = conversation.lastMessage
  if (!lastMessage) return "Chưa có tin nhắn"
  if (lastMessage.messageType === "image") return "[Hình ảnh]"
  return lastMessage.content || "Chưa có tin nhắn"
}

type Props = {
  conversations: ConversationDto[]
  activeId: string | null
  search: string
  totalUnread: number
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  className?: string
}

export function ConversationList({ conversations, activeId, search, totalUnread, onSearchChange, onSelect, className }: Props) {
  const filtered = conversations.filter((c) =>
    c.buyerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={cn("flex flex-col border-r bg-background", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Tin nhắn</h2>
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px] bg-red-500 hover:bg-red-500">
              {totalUnread}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="size-8">
          <IconDotsVertical className="size-4" />
        </Button>
      </div>

      <div className="px-3 py-2 border-b">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <IconMessage2 className="size-8 opacity-30" />
            <p className="text-xs">Không tìm thấy hội thoại</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-muted/40",
                activeId === conv.id && "bg-muted/60"
              )}
            >
              <Avatar name={conv.buyerName} url={conv.buyerAvatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                    {conv.buyerName}
                  </p>
                  <span className={cn("text-[10px] shrink-0 ml-1", conv.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
                    {conv.lastMessage ? formatChatListTimeVN(conv.lastMessage.createdAt) : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {getLastMessagePreview(conv)}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-1 flex items-center justify-center shrink-0 size-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
