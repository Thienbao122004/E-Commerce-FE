"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  IconCheck,
  IconChecks,
  IconChevronLeft,
  IconCircleFilled,
  IconDotsVertical,
  IconMessage2,
  IconPackage,
  IconPhone,
  IconPhoto,
  IconSend,
} from "@tabler/icons-react"
import type { Conversation } from "./chat-types"

function Avatar({ name, online, size = "md" }: { name: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sizeClass = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-11 text-base" : "size-9 text-sm"
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div className="relative shrink-0">
      <div className={cn("rounded-full flex items-center justify-center text-white font-semibold", color, sizeClass)}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
          online ? "bg-green-500" : "bg-muted-foreground/40"
        )} />
      )}
    </div>
  )
}

function MessageStatus({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status) return null
  if (status === "read") return <IconChecks className="size-3.5 text-blue-500" />
  if (status === "delivered") return <IconChecks className="size-3.5 text-muted-foreground" />
  return <IconCheck className="size-3.5 text-muted-foreground" />
}

const QUICK_REPLIES = ["Còn hàng bạn nhé!", "Shop sẽ phản hồi sớm", "Cảm ơn bạn đã quan tâm!", "Bạn có thể đặt hàng tại đây"]

type Props = {
  conversation: Conversation
  message: string
  onMessageChange: (v: string) => void
  onSend: () => void
  onBack: () => void
  className?: string
}

export function ChatWindow({ conversation, message, onMessageChange, onSend, onBack, className }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.id])

  return (
    <div className={cn("flex flex-col flex-1 min-w-0", className)}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background">
        <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={onBack}>
          <IconChevronLeft className="size-4" />
        </Button>
        <Avatar name={conversation.buyerName} online={conversation.online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{conversation.buyerName}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            {conversation.online ? (
              <><IconCircleFilled className="size-2 text-green-500" />Đang hoạt động</>
            ) : "Không hoạt động"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" title="Gọi điện">
            <IconPhone className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Tùy chọn">
            <IconDotsVertical className="size-4" />
          </Button>
        </div>
      </div>

      {conversation.productName && (
        <div className="flex items-center gap-2.5 px-4 py-2 bg-muted/40 border-b text-xs">
          <IconPackage className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Hỏi về sản phẩm:</span>
          <span className="font-medium text-foreground truncate">{conversation.productName}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/10">
        {conversation.messages.map((msg, i) => {
          const isSeller = msg.from === "seller"
          const prevMsg = conversation.messages[i - 1]
          const showAvatar = !isSeller && (!prevMsg || prevMsg.from !== "buyer")
          return (
            <div key={msg.id} className={cn("flex items-end gap-2", isSeller ? "justify-end" : "justify-start")}>
              {!isSeller && (
                <div className="w-7 shrink-0">
                  {showAvatar && <Avatar name={conversation.buyerName} size="sm" />}
                </div>
              )}
              <div className={cn("flex flex-col gap-0.5 max-w-[72%]", isSeller && "items-end")}>
                <div className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  isSeller
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border rounded-bl-sm shadow-sm"
                )}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  {isSeller && <MessageStatus status={msg.status} />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-2 border-t bg-background overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {QUICK_REPLIES.map((text) => (
            <button
              key={text}
              onClick={() => onMessageChange(text)}
              className="shrink-0 rounded-full border px-3 py-1 text-xs hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t bg-background">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground" title="Gửi ảnh">
            <IconPhoto className="size-5" />
          </Button>
          <Textarea
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
            }}
            rows={1}
            className="min-h-[38px] max-h-[120px] resize-none text-sm leading-relaxed py-2"
          />
          <Button size="icon" className="size-9 shrink-0" disabled={!message.trim()} onClick={onSend} title="Gửi (Enter)">
            <IconSend className="size-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">Enter để gửi · Shift+Enter xuống dòng</p>
      </div>
    </div>
  )
}

export function ChatEmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10", className)}>
      <div className="flex items-center justify-center size-16 rounded-full bg-muted">
        <IconMessage2 className="size-8 opacity-40" />
      </div>
      <div className="text-center">
        <p className="font-medium text-sm text-foreground">Chưa chọn hội thoại</p>
        <p className="text-xs mt-1">Chọn một khách hàng bên trái để bắt đầu chat</p>
      </div>
    </div>
  )
}
