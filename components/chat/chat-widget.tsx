"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  startOrGetConversation,
  type ConversationDto,
  type MessageDto,
} from "@/services/conversations"
import {
  IconMessage2,
  IconX,
  IconChevronLeft,
  IconSend,
  IconLoader2,
  IconMinus,
  IconSearch,
  IconCheck,
  IconChecks,
  IconEdit,
  IconShoppingCart,
  IconPhotoPlus,
  IconChevronDown,
} from "@tabler/icons-react"
import { getShopProducts } from "@/services/storefront-shops"
import type { StorefrontProduct } from "@/services/storefront-products"


export interface ChatProductInfo {
  id: string
  slug?: string
  name: string
  imageUrl: string | null
  price: number
  shopId: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = "sm" }: { name: string; url?: string | null; size?: "xs" | "sm" | "md" }) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sizeClass = size === "xs" ? "size-6 text-[10px]" : size === "sm" ? "size-9 text-xs" : "size-10 text-sm"
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  if (url) {
    return (
      <div className={cn("rounded-full overflow-hidden shrink-0", sizeClass)}>
        <img src={url} alt={name} className="size-full object-cover" />
      </div>
    )
  }

  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", color, sizeClass)}>
      {initials}
    </div>
  )
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Hôm qua"
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function getShopDetailHref(shopName?: string, shopId?: string): string {
  const slug = slugify(shopName ?? "")
  return `/shop/${slug || shopId || ""}`
}

function getMessagePreview(lastMessage?: MessageDto | null): string {
  if (!lastMessage) return "Chưa có tin nhắn"
  if (lastMessage.messageType === "image") return "[Hình ảnh]"
  return lastMessage.content || "Chưa có tin nhắn"
}

// ─── Main Widget ────────────────────────────────────────────────────────────

type View = "list" | "chat"

export function ChatWidget() {
  const { session, user, isLoading: authLoading } = useAuth()
  const token = session?.access_token
  const currentUserId = user?.id

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("list")
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [activeConv, setActiveConv] = useState<ConversationDto | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [attachedProduct, setAttachedProduct] = useState<ChatProductInfo | null>(null)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pollConvRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const pollMsgRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const prevConversationsRef = useRef<ConversationDto[]>([])
  const messageCacheRef = useRef<Record<string, MessageDto[]>>({})

  const openChatByShop = useCallback(async (shopId: string, product?: ChatProductInfo) => {
    if (!token || !shopId) return

    setOpen(true)
    if (product) {
      setAttachedProduct(product)
    }

    try {
      const conv = await startOrGetConversation(token, shopId)
      setActiveConv(conv)
      setView("chat")

      const cached = messageCacheRef.current[conv.id]
      if (cached) {
        setMessages(cached)
      } else {
        const detail = await fetchMessages(token, conv.id, 1, 50)
        const fetchedMessages = detail.messages.reverse()
        messageCacheRef.current[conv.id] = fetchedMessages
        setMessages(fetchedMessages)
      }
      await markAsRead(token, conv.id).catch(() => {})

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id)
        if (!exists) return [conv, ...prev]
        return prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      })
    } catch {
      // silent
    }
  }, [token])

  useEffect(() => {
    const handler = (e: Event) => {
      const { shopId, product } = (e as CustomEvent).detail || {}
      if (!shopId) return
      void openChatByShop(shopId, product)
    }

    window.addEventListener("open-chat-widget", handler)
    return () => window.removeEventListener("open-chat-widget", handler)
  }, [openChatByShop])

  useEffect(() => {
    if (!("Notification" in window)) return

    const hasUnread = conversations.some((c) => c.unreadCount > 0)
    if (hasUnread && Notification.permission === "default") {
      void Notification.requestPermission()
    }
  }, [conversations])

  useEffect(() => {
    const previousMap = new Map(prevConversationsRef.current.map((c) => [c.id, c]))

    for (const conv of conversations) {
      const prev = previousMap.get(conv.id)
      if (!prev) continue

      const hasNewUnread = conv.unreadCount > prev.unreadCount
      const lastMessage = conv.lastMessage
      const isIncoming = !!lastMessage && lastMessage.senderId !== currentUserId
      const isCurrentlyViewing = open && activeConv?.id === conv.id

      if (!hasNewUnread || !isIncoming || isCurrentlyViewing) continue

      const senderName = conv.shopName || conv.buyerName || "Tin nhắn mới"
      const preview = lastMessage?.messageType === "image"
        ? "Da gui mot hinh anh"
        : (lastMessage?.content || "Ban co tin nhan moi")

      toast.message(`Tin nhan moi tu ${senderName}`, {
        description: preview,
        duration: 4000,
      })

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Tin nhan moi tu ${senderName}`, { body: preview })
      }
    }

    prevConversationsRef.current = conversations
  }, [conversations, currentUserId, open, activeConv?.id])

  // Don't render if not logged in or still loading
  if (authLoading || !token) return null

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-2 z-[9999] flex items-center justify-center size-14 rounded-full bg-white border border-gray-200 text-gray-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
          title="Chat"
        >
          <IconMessage2 className="size-6 group-hover:scale-110 transition-transform" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 border-2 border-white shadow">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* ── Chat Panel ───────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col rounded-2xl bg-background border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ width: activeConv ? "640px" : "270px", height: "460px", maxHeight: "74vh", transition: "width 0.25s ease" }}
        >
          <ChatWidgetInner
            token={token}
            currentUserId={currentUserId}
            view={view}
            setView={setView}
            conversations={conversations}
            setConversations={setConversations}
            activeConv={activeConv}
            setActiveConv={setActiveConv}
            messages={messages}
            setMessages={setMessages}
            message={message}
            setMessage={setMessage}
            search={search}
            setSearch={setSearch}
            loading={loading}
            setLoading={setLoading}
            loadingMessages={loadingMessages}
            setLoadingMessages={setLoadingMessages}
            sending={sending}
            setSending={setSending}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            pollConvRef={pollConvRef}
            pollMsgRef={pollMsgRef}
            totalUnread={totalUnread}
            onClose={() => setOpen(false)}
            onCollapseToList={() => {
              setView("list")
              setActiveConv(null)
              setMessages([])
              setAttachedProduct(null)
              setAttachedImage(null)
              clearInterval(pollMsgRef.current)
            }}
            onHide={() => setOpen(false)}
            attachedProduct={attachedProduct}
            setAttachedProduct={setAttachedProduct}
            attachedImage={attachedImage}
            setAttachedImage={setAttachedImage}
            showProductPicker={showProductPicker}
            setShowProductPicker={setShowProductPicker}
            imageInputRef={imageInputRef}
            messageCacheRef={messageCacheRef}
          />
        </div>
      )}
    </>
  )
}

// ─── Inner Component ────────────────────────────────────────────────────────

type InnerProps = {
  token: string
  currentUserId?: string
  view: View
  setView: (v: View) => void
  conversations: ConversationDto[]
  setConversations: React.Dispatch<React.SetStateAction<ConversationDto[]>>
  activeConv: ConversationDto | null
  setActiveConv: (c: ConversationDto | null) => void
  messages: MessageDto[]
  setMessages: React.Dispatch<React.SetStateAction<MessageDto[]>>
  message: string
  setMessage: (v: string) => void
  search: string
  setSearch: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  loadingMessages: boolean
  setLoadingMessages: (v: boolean) => void
  sending: boolean
  setSending: (v: boolean) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  pollConvRef: React.MutableRefObject<ReturnType<typeof setInterval> | undefined>
  pollMsgRef: React.MutableRefObject<ReturnType<typeof setInterval> | undefined>
  totalUnread: number
  onClose: () => void
  onCollapseToList: () => void
  onHide: () => void
  attachedProduct: ChatProductInfo | null
  setAttachedProduct: (p: ChatProductInfo | null) => void
  attachedImage: string | null
  setAttachedImage: (img: string | null) => void
  showProductPicker: boolean
  setShowProductPicker: (v: boolean) => void
  imageInputRef: React.RefObject<HTMLInputElement | null>
  messageCacheRef: React.MutableRefObject<Record<string, MessageDto[]>>
}

function ChatWidgetInner({
  token, currentUserId, setView,
  conversations, setConversations,
  activeConv, setActiveConv,
  messages, setMessages,
  message, setMessage,
  search, setSearch,
  loading, setLoading,
  loadingMessages, setLoadingMessages,
  sending, setSending,
  messagesEndRef, inputRef,
  pollConvRef, pollMsgRef,
  totalUnread, onClose, onCollapseToList, onHide,
  attachedProduct, setAttachedProduct,
  attachedImage, setAttachedImage,
  showProductPicker, setShowProductPicker, imageInputRef, messageCacheRef,
}: InnerProps) {
  const shouldBootstrapConversationsRef = useRef(conversations.length === 0)

  const loadConversations = useCallback(async (withLoading = false) => {
    if (withLoading) setLoading(true)
    try {
      const data = await fetchConversations(token)
      setConversations(data)
    } catch {

    } finally {
      if (withLoading) setLoading(false)
    }
  }, [token, setConversations, setLoading])

  useEffect(() => {
    if (shouldBootstrapConversationsRef.current) {
      void loadConversations(true)
      shouldBootstrapConversationsRef.current = false
    } else {
      setLoading(false)
    }

    pollConvRef.current = setInterval(() => {
      void loadConversations(false)
    }, 10_000)

    return () => clearInterval(pollConvRef.current)
  }, [loadConversations, pollConvRef, setLoading])

  const loadMessages = useCallback(async (convId: string, force = false) => {
    const cached = messageCacheRef.current[convId]
    if (!force && cached) {
      setMessages(cached)
      setLoadingMessages(false)
      await markAsRead(token, convId).catch(() => {})
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c))
      return
    }

    setLoadingMessages(true)
    try {
      const detail = await fetchMessages(token, convId, 1, 50)
      const fetchedMessages = detail.messages.reverse()
      messageCacheRef.current[convId] = fetchedMessages
      setMessages(fetchedMessages)
      await markAsRead(token, convId).catch(() => {})
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c)
      )
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [token, setMessages, setLoadingMessages, setConversations, messageCacheRef])

  useEffect(() => {
    if (!activeConv) return
    clearInterval(pollMsgRef.current)
    pollMsgRef.current = setInterval(async () => {
      try {
        const detail = await fetchMessages(token, activeConv.id, 1, 50)
        const polledMessages = detail.messages.reverse()
        messageCacheRef.current[activeConv.id] = polledMessages
        setMessages(polledMessages)
      } catch {}
    }, 5_000)
    return () => clearInterval(pollMsgRef.current)
  }, [activeConv, token, setMessages, pollMsgRef, messageCacheRef])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, messagesEndRef])

  const handleSelect = useCallback((conv: ConversationDto) => {
    setActiveConv(conv)
    setView("chat")
    loadMessages(conv.id)
  }, [setActiveConv, setView, loadMessages])

  const handleBack = () => {
    setView("list")
    setActiveConv(null)
    setMessages([])
    setAttachedProduct(null)
    setAttachedImage(null)
    clearInterval(pollMsgRef.current)
  }

  const handleSend = async () => {
    if (!activeConv || sending) return

    let content = message.trim()
    if (attachedProduct && content === "") {
      content = `[Sản phẩm] ${attachedProduct.name} - ${formatPrice(attachedProduct.price)}`
    }
    if (!content && !attachedImage) return

    setMessage("")
    setSending(true)
    try {
      if (content) {
        const textMsg = await sendMessage(token, activeConv.id, content, "text")
        setMessages((prev) => [...prev, textMsg])
        setConversations((prev) =>
          prev.map((c) => c.id === activeConv.id ? { ...c, lastMessage: textMsg } : c)
        )
      }

      if (attachedImage) {
        const imageMsg = await sendMessage(token, activeConv.id, attachedImage, "image")
        setMessages((prev) => [...prev, imageMsg])
        setConversations((prev) =>
          prev.map((c) => c.id === activeConv.id ? { ...c, lastMessage: imageMsg } : c)
        )
      }

      if (attachedImage) setAttachedImage(null)
    } catch {
      setMessage(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const filtered = conversations.filter((c) => {
    const name = c.shopName || c.buyerName
    return name.toLowerCase().includes(search.toLowerCase())
  })

  if (activeConv) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-white shrink-0">
          <IconMessage2 className="size-5 text-orange-500" />
          <span className="font-semibold text-sm flex-1 text-gray-800">Chat</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="Đóng">
            <IconX className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-[220px] shrink-0 border-r flex flex-col bg-white">
            <div className="px-2.5 py-2.5 border-b">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <input
                  placeholder="Tìm theo tên"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-gray-50 border border-gray-200 outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                />
              </div>
            </div>
            {/* Conversation items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <IconLoader2 className="size-4 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-xs">
                  Chưa có hội thoại nào
                </div>
              ) : (
                filtered.map((conv) => {
                  const displayName = conv.shopName || conv.buyerName
                  const isActive = conv.id === activeConv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelect(conv)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors border-b border-gray-50",
                        isActive ? "bg-gray-100" : "hover:bg-gray-50"
                      )}
                    >
                      <Avatar name={displayName} url={conv.shopLogoUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-xs truncate max-w-[120px]", conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                            {displayName}
                          </p>
                          <span className={cn("text-[10px] shrink-0 ml-1", conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400")}>
                            {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={cn("text-[11px] truncate max-w-[140px]", conv.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-400")}>
                            {getMessagePreview(conv.lastMessage)}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-1 flex items-center justify-center shrink-0 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] text-white font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: Chat Area ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Right panel header with shop name */}
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50/80 shrink-0">
              <button onClick={handleBack} className="p-1 hover:bg-gray-200 rounded-lg transition-colors md:hidden">
                <IconChevronLeft className="size-4 text-gray-500" />
              </button>
              <Avatar name={activeConv.shopName || activeConv.buyerName} url={activeConv.shopLogoUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <a
                  href={getShopDetailHref(activeConv.shopName, activeConv.shopId)}
                  className="font-semibold text-sm text-gray-800 truncate hover:underline"
                >
                  {activeConv.shopName || activeConv.buyerName}
                </a>
              </div>
              <button
                type="button"
                onClick={onCollapseToList}
                className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Thu nhỏ"
              >
                <IconChevronDown className="size-3" />
                Thu nhỏ
              </button>
            </div>

            {/* ── Product Card (top of chat) ──────────────────────────── */}
            {attachedProduct && (
              <div className="px-3 py-2 border-b bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <a
                    href={`/products/${attachedProduct.slug || attachedProduct.id}`}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    {/* Product image */}
                    <div className="size-[52px] rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      {attachedProduct.imageUrl ? (
                        <img src={attachedProduct.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <IconShoppingCart className="size-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium leading-tight line-clamp-2 text-gray-800 hover:underline">{attachedProduct.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] font-bold text-red-500">{formatPrice(attachedProduct.price)}</span>
                      </div>
                    </div>
                  </a>
                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <a
                      href={`/products/${attachedProduct.slug || attachedProduct.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 transition-colors whitespace-nowrap shadow-sm"
                    >
                      Mua ngay
                    </a>
                    <button
                      onClick={() => setShowProductPicker(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-0.5"
                    >
                      <IconEdit className="size-3" /> Thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Messages ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-white">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <IconLoader2 className="size-5 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  Bắt đầu cuộc trò chuyện
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUserId
                  const prevMsg = messages[i - 1]
                  const showAvatar = !isMe && (!prevMsg || prevMsg.senderId === currentUserId)
                  const displayName = activeConv?.shopName || activeConv?.buyerName || ""
                  return (
                    <div key={msg.id} className={cn("flex items-end gap-1.5", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <div className="w-6 shrink-0">
                          {showAvatar && <Avatar name={displayName} url={activeConv?.shopLogoUrl} size="xs" />}
                        </div>
                      )}
                      <div className={cn("flex flex-col gap-0.5 max-w-[75%]", isMe && "items-end")}>
                        <div className={cn(
                          "rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed",
                          isMe
                            ? "bg-gray-200 text-gray-900 rounded-br-sm"
                            : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                        )}>
                          {msg.messageType === "image" ? (
                            <img
                              src={msg.content}
                              alt="Ảnh đã gửi"
                              className="max-h-48 w-auto rounded-xl object-contain"
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-0.5">
                          <span className="text-[9px] text-gray-400">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.isRead
                              ? <IconChecks className="size-3 text-blue-500" />
                              : <IconCheck className="size-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Attached Image Preview ────────────────────────────────── */}
            {attachedImage && (
              <div className="px-3 pt-2 border-t bg-white">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="size-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={attachedImage} alt="Ảnh đính kèm" className="size-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium leading-tight line-clamp-1">Ảnh đính kèm</p>
                    <p className="text-[10px] text-gray-400">Sẽ gửi cùng tin nhắn</p>
                  </div>
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    <IconX className="size-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Input Area ───────────────────────────────────────────── */}
            <div className="px-3 py-2 border-t bg-white shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] text-gray-400">Nhập nội dung tin nhắn</span>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center justify-center size-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors shrink-0"
                  title="Gửi ảnh"
                >
                  <IconPhotoPlus className="size-4" />
                </button>
                <textarea
                  ref={inputRef}
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  rows={1}
                  className="flex-1 min-h-[34px] max-h-[80px] resize-none text-[13px] leading-relaxed py-1.5 px-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                />
                <button
                  onClick={handleSend}
                  disabled={(!message.trim() && !attachedProduct && !attachedImage) || sending}
                  className="flex items-center justify-center size-8 rounded-full bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-800 transition-all shrink-0"
                  title="Gửi"
                >
                  {sending ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSend className="size-3.5" />}
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 4 * 1024 * 1024) {
                    e.currentTarget.value = ""
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : null
                    setAttachedImage(result)
                  }
                  reader.readAsDataURL(file)
                  e.currentTarget.value = ""
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Product Picker Modal ──────────────────────────────────────── */}
        {showProductPicker && activeConv && (
          <ProductPickerModal
            shopId={activeConv.shopId}
            onSelect={(p) => {
              setAttachedProduct(p)
              setShowProductPicker(false)
            }}
            onClose={() => setShowProductPicker(false)}
          />
        )}
      </div>
    )
  }

  // ── List-only View (no active conversation) ─────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-white text-gray-800 shrink-0">
        <IconMessage2 className="size-5 text-gray-700" />
        <span className="font-semibold text-sm flex-1">Chat</span>
        {totalUnread > 0 && (
          <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5">
            {totalUnread}
          </span>
        )}
        {/* <button onClick={onHide} className="p-1 hover:bg-gray-100 rounded-lg transition-colors" title="Thu gọn">
          <IconMinus className="size-4" />
        </button> */}
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors" title="Đóng">
          <IconX className="size-4" />
        </button>
      </div>
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <IconMessage2 className="size-6 opacity-30" />
            <p className="text-xs">Chưa có hội thoại nào</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const displayName = conv.shopName || conv.buyerName
            return (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
              >
                <Avatar name={displayName} url={conv.shopLogoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {displayName}
                    </p>
                    <span className={cn("text-[10px] shrink-0 ml-1", conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400")}>
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn("text-[11px] truncate", conv.unreadCount > 0 ? "text-gray-800" : "text-gray-400")}>
                      {getMessagePreview(conv.lastMessage)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-1 flex items-center justify-center shrink-0 size-4 rounded-full bg-gray-800 text-[9px] text-white font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

// ─── Product Picker Modal ───────────────────────────────────────────────────

function ProductPickerModal({
  shopId,
  onSelect,
  onClose,
}: {
  shopId: string
  onSelect: (p: ChatProductInfo) => void
  onClose: () => void
}) {
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")

  useEffect(() => {
    getShopProducts(shopId, { pageSize: 50 })
      .then((res) => setProducts(res.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [shopId])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[10000] bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[70vh] max-h-[720px] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-bold text-gray-800">Chọn sản phẩm</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <IconX className="size-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              placeholder="Tìm tên sản phẩm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <IconLoader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
              <IconShoppingCart className="size-6 opacity-30" />
              <p className="text-xs">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onSelect({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    imageUrl: p.imageUrls?.[0] ?? null,
                    price: p.basePrice,
                    shopId,
                  })}
                >
                  <div className="size-14 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-200">
                    {p.imageUrls?.[0] ? (
                      <img src={p.imageUrls[0]} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <IconShoppingCart className="size-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium line-clamp-2 leading-tight text-gray-700 group-hover:text-gray-900">{p.name}</p>
                    <p className="text-[12px] font-bold text-red-500 mt-1">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.basePrice)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect({
                        id: p.id,
                        slug: p.slug,
                        name: p.name,
                        imageUrl: p.imageUrls?.[0] ?? null,
                        price: p.basePrice,
                        shopId,
                      })
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                  >
                    Chọn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
