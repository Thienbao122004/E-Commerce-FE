"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  createChatRealtimeConnection,
  disposeChatRealtimeConnection,
  startChatRealtimeConnection,
} from "@/services/chat-realtime"
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  type ConversationDto,
  type MessageDto,
} from "@/services/conversations"
import { ConversationList } from "./_components/conversation-list"
import { ChatWindow, ChatEmptyState } from "./_components/chat-window"
import { IconLoader2 } from "@tabler/icons-react"

export default function SellerChatPage() {
  const { session, user } = useAuth()
  const token = session?.access_token
  const currentUserId = user?.id ?? null

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showList, setShowList] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const upsertConversation = useCallback((next: ConversationDto) => {
    if (!currentUserId) return
    if (next.sellerId !== currentUserId || next.buyerId === currentUserId) return

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === next.id)
      const merged = exists
        ? prev.map((c) => (c.id === next.id ? { ...c, ...next } : c))
        : [next, ...prev]

      return [...merged].sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt
        const bTime = b.lastMessage?.createdAt ?? b.createdAt
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
    })
  }, [currentUserId])

  // ── Load conversations ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token || !currentUserId) {
      setLoading(false)
      return
    }
    try {
      const data = await fetchConversations(token)
      const sellerOnly = data.filter(
        (c) => c.sellerId === currentUserId && c.buyerId !== currentUserId
      )
      setConversations(sellerOnly)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token, currentUserId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ── Load messages when selecting conversation ─────────────────────────
  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!token) return
      setLoadingMessages(true)
      try {
        const detail = await fetchMessages(token, conversationId, 1, 50)
        setMessages(detail.messages.reverse())
        await markAsRead(token, conversationId).catch(() => {})
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        )
      } catch {
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  // Realtime updates via SignalR
  useEffect(() => {
    const connection = createChatRealtimeConnection(token, {
      onConversationUpdated: (incoming: ConversationDto) => {
      if (!incoming?.id) return
      upsertConversation(incoming)
      },
      onChatMessageReceived: (payload: { conversationId?: string; message?: MessageDto }) => {
      const conversationId = payload?.conversationId
      const incomingMessage = payload?.message
      if (!conversationId || !incomingMessage) return

      setConversations((prev) => {
        if (!prev.some((c) => c.id === conversationId)) {
          void loadConversations()
          return prev
        }

        const updated = prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: incomingMessage }
            : c
        )

        return [...updated].sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ?? a.createdAt
          const bTime = b.lastMessage?.createdAt ?? b.createdAt
          return new Date(bTime).getTime() - new Date(aTime).getTime()
        })
      })

      setMessages((prev) => {
        if (activeIdRef.current !== conversationId) return prev
        if (prev.some((m) => m.id === incomingMessage.id)) return prev
        return [...prev, incomingMessage]
      })
      },
      onReconnected: () => {
        void loadConversations()
        if (activeIdRef.current) void loadMessages(activeIdRef.current)
      },
    })

    void startChatRealtimeConnection(connection)

    return () => {
      void disposeChatRealtimeConnection(connection)
    }
  }, [token, loadConversations, loadMessages, upsertConversation])

  // ── Send message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !activeId || !token || sending) return
    const content = message.trim()
    setMessage("")
    setSending(true)
    try {
      const newMsg = await sendMessage(token, activeId, content)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, lastMessage: newMsg } : c
        )
      )
    } catch {
      setMessage(content) // restore on error
    } finally {
      setSending(false)
    }
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    setShowList(false)
  }

  const active = conversations.find((c) => c.id === activeId) ?? null
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  if (loading) {
    return (
      <div className="flex h-[calc(100svh-var(--header-height))] min-h-0 items-center justify-center overflow-hidden">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden w-full mx-auto">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          search={search}
          totalUnread={totalUnread}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          className={cn("w-full md:w-[300px] lg:w-[320px] shrink-0 min-h-0", !showList && "hidden md:flex")}
        />

        {active ? (
          <ChatWindow
            conversation={active}
            messages={messages}
            message={message}
            loadingMessages={loadingMessages}
            sending={sending}
            onMessageChange={setMessage}
            onSend={handleSend}
            onBack={() => setShowList(true)}
            className={cn("min-h-0", showList && "hidden md:flex")}
          />
        ) : (
          <ChatEmptyState className={cn("min-h-0", showList && "hidden md:flex")} />
        )}
      </div>
    </div>
  )
}
