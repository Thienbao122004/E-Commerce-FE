"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
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
  const { session } = useAuth()
  const token = session?.access_token

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showList, setShowList] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // ── Load conversations ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return
    try {
      const data = await fetchConversations(token)
      setConversations(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadConversations()
    pollRef.current = setInterval(loadConversations, 10_000)
    return () => clearInterval(pollRef.current)
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

  // Polling messages for active conversation
  useEffect(() => {
    if (!activeId || !token) return
    const interval = setInterval(async () => {
      try {
        const detail = await fetchMessages(token, activeId, 1, 50)
        setMessages(detail.messages.reverse())
      } catch {
        // silent
      }
    }, 5_000)
    return () => clearInterval(interval)
  }, [activeId, token])

  // ── Send message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !activeId || !token || sending) return
    const content = message.trim()
    setMessage("")
    setSending(true)
    try {
      const newMsg = await sendMessage(token, activeId, content)
      setMessages((prev) => [...prev, newMsg])
      // Update last message in list
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
      <div className="flex flex-1 items-center justify-center h-[calc(100vh-64px)]">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-64px)] overflow-hidden w-full max-w-[1360px] mx-auto">
      <div className="flex h-full">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          search={search}
          totalUnread={totalUnread}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          className={cn("w-full md:w-[300px] lg:w-[320px] shrink-0", !showList && "hidden md:flex")}
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
            className={cn(showList && "hidden md:flex")}
          />
        ) : (
          <ChatEmptyState className={cn(showList && "hidden md:flex")} />
        )}
      </div>
    </div>
  )
}
