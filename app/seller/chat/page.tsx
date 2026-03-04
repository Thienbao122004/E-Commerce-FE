"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { MOCK_CONVERSATIONS } from "./_components/chat-types"
import { ConversationList } from "./_components/conversation-list"
import { ChatWindow, ChatEmptyState } from "./_components/chat-window"

export default function SellerChatPage() {
  const [conversations] = useState(MOCK_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string | null>("c1")
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [showList, setShowList] = useState(true)

  const active = conversations.find((c) => c.id === activeId)
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  const handleSend = () => {
    if (!message.trim()) return
    setMessage("")
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    setShowList(false)
  }

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-64px)] overflow-hidden">
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
            message={message}
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
