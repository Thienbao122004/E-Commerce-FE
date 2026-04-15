"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { formatChatMessageTimeVN as formatMessageTime } from "@/lib/formatters"
import {
  IconCheck,
  IconChecks,
  IconChevronLeft,
  IconDotsVertical,
  IconLoader2,
  IconMessage2,
  IconPhone,
  IconPhoto,
  IconSend,
} from "@tabler/icons-react"
import type { ConversationDto, MessageDto } from "./chat-types"
import { useAuth } from "@/contexts/auth-context"

function Avatar({ name, url, online, size = "md" }: { name: string; url?: string | null; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sizeClass = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-11 text-base" : "size-9 text-sm"
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div className="relative shrink-0">
      {url ? (
        <div className={cn("rounded-full overflow-hidden", sizeClass)}>
          <img src={url} alt={name} className="size-full object-cover" />
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

function MessageStatus({ isRead }: { isRead: boolean }) {
  if (isRead) return <IconChecks className="size-3.5 text-blue-500" />
  return <IconCheck className="size-3.5 text-muted-foreground" />
}

const QUICK_REPLIES = ["Còn hàng bạn nhé!", "Shop sẽ phản hồi sớm", "Cảm ơn bạn đã quan tâm!", "Bạn có thể đặt hàng tại đây"]

type Props = {
  conversation: ConversationDto
  messages: MessageDto[]
  message: string
  loadingMessages: boolean
  sending: boolean
  onMessageChange: (v: string) => void
  onSend: () => void
  onBack: () => void
  className?: string
}

export function ChatWindow({ conversation, messages, message, loadingMessages, sending, onMessageChange, onSend, onBack, className }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const currentUserId = user?.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, conversation.id])

  return (
    <div className={cn("flex flex-col flex-1 min-w-0 h-full min-h-0 overflow-hidden", className)}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background">
        <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={onBack}>
          <IconChevronLeft className="size-4" />
        </Button>
        <Avatar name={conversation.buyerName} url={conversation.buyerAvatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{conversation.buyerName}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            Khách hàng
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-muted/10">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Chưa có tin nhắn
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSeller = msg.senderId === currentUserId
            const prevMsg = messages[i - 1]
            const showAvatar = !isSeller && (!prevMsg || prevMsg.senderId === currentUserId)
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isSeller ? "justify-end" : "justify-start")}>
                {!isSeller && (
                  <div className="w-7 shrink-0">
                    {showAvatar && <Avatar name={conversation.buyerName} url={conversation.buyerAvatarUrl} size="sm" />}
                  </div>
                )}
                <div className={cn("flex flex-col gap-0.5 max-w-[72%]", isSeller && "items-end")}>
                  <div className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
                    isSeller
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-background border rounded-bl-sm shadow-sm"
                  )}>
                    {msg.messageType === "image" ? (
                      <img
                        src={msg.content}
                        alt="Ảnh đã gửi"
                        className="max-h-56 w-auto rounded-lg object-contain"
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
                    {isSeller && <MessageStatus isRead={msg.isRead} />}
                  </div>
                </div>
              </div>
            )
          })
        )}
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
          <Button
            size="icon"
            className="size-9 shrink-0"
            disabled={!message.trim() || sending}
            onClick={onSend}
            title="Gửi (Enter)"
          >
            {sending ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />}
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
