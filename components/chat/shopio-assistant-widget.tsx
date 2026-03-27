"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ShoppingBag,
  X,
  Minus,
  Send,
  RotateCcw,
  MapPin,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  Plus,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { aiChatService, type AiChatSendResponse, type AiSessionSummary } from "@/services/ai-chat"
import { cartService } from "@/services/cart"
import { profileService } from "@/services/profile"
import { paymentsService } from "@/services/payments"
import { ordersService } from "@/services/orders"
import type { AddressResponse } from "@/types/profile"

type PaymentMethod = "vnpay" | "momo"

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; logo: string }> = [
  { id: "vnpay", label: "VNPay", logo: "/vnpay-logo.png" },
  { id: "momo", label: "MoMo", logo: "/momo-logo.png" },
]

const CART_UPDATED_EVENT = "cart:updated"
const AI_CHAT_CACHE_PREFIX = "ai-chat-ui-state:"

type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  responseMeta?: AiChatSendResponse
}

type ConfirmPreview = {
  id: string
  name: string
  imageUrl?: string
  basePrice: number
  quantity: number
}

type ProductSelection = {
  checked: boolean
  quantity: number
}

type ConfirmTargetState = {
  cartId?: string
  messageId: string
  preview?: ConfirmPreview
  previews?: ConfirmPreview[]
}

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ"
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function formatSessionTime(dateStr?: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Hôm qua"
  if (diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

function isOrderRequestText(text: string) {
  return /tạo đơn|đặt đơn|checkout|thanh toán|mua luôn|chốt đơn/i.test(text)
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: "#c4b8aa",
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  )
}

function ShopioAvatar({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const sizeClass = size === "xs" ? "size-6" : size === "sm" ? "size-8" : "size-10"
  const iconSize = size === "xs" ? 12 : size === "sm" ? 16 : 20
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0`}
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #f59c2a 100%)" }}
    >
      <ShoppingBag size={iconSize} className="text-white" />
    </div>
  )
}

export function ShopioAssistantWidget() {
  const { session, isLoading: authLoading } = useAuth()
  const token = session?.access_token

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [view, setView] = useState<"list" | "chat">("list")

  // Sessions list state
  const [sessions, setSessions] = useState<AiSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [bootLoading, setBootLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [sending, setSending] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay")
  const [selectedProductsByMessageId, setSelectedProductsByMessageId] = useState<
    Record<string, Record<string, ProductSelection>>
  >({})
  const [applyingSelectionMessageId, setApplyingSelectionMessageId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTargetState | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  )
  const effectiveAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress,
    [addresses, selectedAddressId, defaultAddress]
  )

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await aiChatService.listSessions()
      if (res.success) setSessions(res.sessions)
    } catch { /* non-blocking */ }
    finally { setSessionsLoading(false) }
  }, [])

  const loadAddresses = useCallback(async () => {
    try {
      const res = await profileService.getAddresses()
      if (res.success) {
        const list = res.data ?? []
        setAddresses(list)
        setSelectedAddressId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev
          return list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? ""
        })
      }
    } catch { /* non-blocking */ }
  }, [])

  // Boot session only once when widget opens
  const boot = useCallback(async () => {
    if (booted || bootLoading) return
    setBootLoading(true)
    try {
      const session = await aiChatService.getOrCreateSession()
      setSessionId(session.sessionId)

      // BE history (plain messages, không có responseMeta/products)
      const beMessages: UiMessage[] = (session.history ?? []).map((m) => ({
        id: `${m.id}`,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))

      // Load cache
      const cachedRaw = sessionStorage.getItem(`${AI_CHAT_CACHE_PREFIX}${session.sessionId}`)
      let cachedMessages: UiMessage[] = []
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as {
            messages?: UiMessage[]
            confirmTarget?: ConfirmTargetState | null
            selectedAddressId?: string
            selectedProductsByMessageId?: Record<string, Record<string, ProductSelection>>
          }
          if (cached.messages?.length) cachedMessages = cached.messages
          if (cached.confirmTarget) setConfirmTarget(cached.confirmTarget)
          if (cached.selectedAddressId) setSelectedAddressId(cached.selectedAddressId)
          if (cached.selectedProductsByMessageId) setSelectedProductsByMessageId(cached.selectedProductsByMessageId)
        } catch { /* ignore */ }
      }

      // Merge: dùng cached nếu có (vì có responseMeta/products), bổ sung BE messages còn thiếu
      // BE messages có id dạng số "1", "2"... — cached có "u-xxx", "a-xxx"
      if (cachedMessages.length > 0) {
        const cachedIds = new Set(cachedMessages.map((m) => m.id))
        const extraFromBe = beMessages.filter((m) => !cachedIds.has(m.id))
        // Sắp xếp theo thời gian
        const merged = [...cachedMessages, ...extraFromBe].sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return ta - tb
        })
        setMessages(merged)
      } else {
        setMessages(beMessages)
      }

      await loadAddresses()
      setBooted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể kết nối trợ lý")
    } finally {
      setBootLoading(false)
    }
  }, [booted, bootLoading, loadAddresses])

  useEffect(() => {
    if (open && !booted) void boot()
    if (open) void loadSessions()
  }, [open, booted, boot, loadSessions])

  useEffect(() => { if (open) scrollToBottom() }, [messages, open, scrollToBottom])

  // Cache đầy đủ: messages + UI state (để khôi phục sau khi redirect VNPay/MoMo)
  useEffect(() => {
    if (!sessionId) return
    sessionStorage.setItem(
      `${AI_CHAT_CACHE_PREFIX}${sessionId}`,
      JSON.stringify({ messages, confirmTarget, selectedAddressId, selectedProductsByMessageId })
    )
  }, [sessionId, messages, confirmTarget, selectedAddressId, selectedProductsByMessageId])

  const buildConfirmFromCart = useCallback(async (messageId: string, preferredProductId?: string, quantity = 1) => {
    const cart = await cartService.getMyCart().catch(() => null)
    if (!cart?.id || !cart.items?.length) return false
    const matched = preferredProductId
      ? cart.items.find((i) => i.productId === preferredProductId)
      : cart.items[0]
    if (!matched) return false
    setConfirmTarget({
      cartId: cart.id, messageId,
      preview: { id: matched.productId, name: matched.productName, imageUrl: matched.productImage, basePrice: matched.unitPrice, quantity },
      previews: [{ id: matched.productId, name: matched.productName, imageUrl: matched.productImage, basePrice: matched.unitPrice, quantity }],
    })
    return true
  }, [])

  const getSelectedProducts = useCallback(
    (messageId: string, products: NonNullable<UiMessage["responseMeta"]>["products"]) => {
      const selections = selectedProductsByMessageId[messageId] ?? {}
      return products
        .map((p) => {
          const sel = selections[p.id]
          if (!sel?.checked) return null
          return { ...p, quantity: Math.max(1, Number(sel.quantity) || 1) }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    },
    [selectedProductsByMessageId]
  )

  const handleApplySelectedProducts = useCallback(async (message: UiMessage) => {
    const products = message.responseMeta?.products ?? []
    if (!products.length) return
    const selectedItems = getSelectedProducts(message.id, products)
    if (!selectedItems.length) { toast.message("Bạn hãy tick ít nhất 1 sản phẩm trước khi bấm OK."); return }

    setApplyingSelectionMessageId(message.id)
    try {
      for (const item of selectedItems) {
        await cartService.addItem({ productId: item.id, quantity: item.quantity })
      }
      const cart = await cartService.getMyCart()
      window.dispatchEvent(new Event(CART_UPDATED_EVENT))
      const first = selectedItems[0]
      const confirmMsgId = `a-bulk-confirm-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: confirmMsgId, role: "assistant",
          content: selectedItems.length === 1
            ? `Mình đã thêm ${first.quantity} x "${first.name}" vào giỏ. Bạn có muốn tạo đơn ngay không?`
            : `Mình đã thêm ${selectedItems.length} sản phẩm bạn tick vào giỏ. Bạn có muốn tạo đơn ngay không?`,
          createdAt: new Date().toISOString(),
        },
      ])
      setConfirmTarget({
        cartId: cart.id, messageId: confirmMsgId,
        preview: { id: first.id, name: first.name, imageUrl: first.imageUrl, basePrice: first.basePrice, quantity: first.quantity },
        previews: selectedItems.map((item) => ({ id: item.id, name: item.name, imageUrl: item.imageUrl, basePrice: item.basePrice, quantity: item.quantity })),
      })
      toast.success(selectedItems.length === 1 ? "Đã thêm sản phẩm đã chọn vào giỏ" : `Đã thêm ${selectedItems.length} sản phẩm vào giỏ`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm sản phẩm vào giỏ")
    } finally {
      setApplyingSelectionMessageId(null)
    }
  }, [getSelectedProducts])

  const handleSend = useCallback(async () => {
    if (!sessionId || !input.trim() || sending) return
    const msg = input.trim()
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg, createdAt: new Date().toISOString() }])
    setInput("")
    setSending(true)
    try {
      const res = await aiChatService.sendMessage(sessionId, msg)
      const fallback = (res.products?.length ?? 0) > 0
        ? "Mình đã tìm thấy sản phẩm phù hợp ở bên dưới."
        : "Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử thêm từ khóa ngành hàng, mức giá hoặc thương hiệu nhé."
      const assistantMsg: UiMessage = {
        id: `a-${Date.now()}`, role: "assistant",
        content: res.reply?.trim() || fallback,
        createdAt: new Date().toISOString(),
        responseMeta: { ...res, cartId: res.cartId },
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (res.products?.length) {
        setSelectedProductsByMessageId((prev) => {
          const oldMap = prev[assistantMsg.id] ?? {}
          const nextMap = res.products.reduce<Record<string, ProductSelection>>((acc, p) => {
            acc[p.id] = { checked: oldMap[p.id]?.checked ?? false, quantity: oldMap[p.id]?.quantity ?? 1 }
            return acc
          }, {})
          return { ...prev, [assistantMsg.id]: nextMap }
        })
      }

      const shouldConfirm =
        (res.needsConfirmation && res.intent === "checkout") || res.intent === "checkout" ||
        isOrderRequestText(msg) || /bạn có muốn.*tạo đơn|xác nhận.*đơn|tạo đơn hàng/i.test(res.reply)

      if (shouldConfirm) {
        if (res.cartId) {
          setConfirmTarget({ cartId: res.cartId, messageId: assistantMsg.id })
        } else {
          const ok = await buildConfirmFromCart(assistantMsg.id)
          if (!ok && isOrderRequestText(msg)) toast.error("Hiện chưa có sản phẩm trong giỏ để tạo đơn")
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể gửi tin nhắn")
    } finally {
      setSending(false)
    }
  }, [sessionId, input, sending, buildConfirmFromCart])

  const handleConfirmOrder = useCallback(async () => {
    if (!sessionId) { toast.message("Phiên chưa sẵn sàng."); return }
    setOrderLoading(true)
    try {
      const latestRes = await profileService.getAddresses().catch(() => null)
      const latest = latestRes?.success ? (latestRes.data ?? []) : []
      if (latest.length) setAddresses(latest)
      const resolved = latest.find((a) => a.id === selectedAddressId) ?? latest.find((a) => a.isDefault) ?? latest[0] ?? effectiveAddress
      if (!resolved) { toast.message("Bạn chưa có địa chỉ giao hàng."); return }
      if (resolved.id !== selectedAddressId) setSelectedAddressId(resolved.id)

      let cartId = confirmTarget?.cartId
      if (!cartId) { const c = await cartService.getMyCart().catch(() => null); cartId = c?.id }
      if (!cartId) { toast.message("Giỏ hàng đang trống."); return }

      const res = await aiChatService.confirmOrder(sessionId, cartId, resolved.id)
      if (res.success && res.orderId) {
        const providerLabel = paymentMethod === "momo" ? "MoMo" : "VNPay"
        const payFn = paymentMethod === "momo"
          ? paymentsService.createMoMoPayment
          : paymentsService.createVNPayPayment

        const payRes = await payFn(res.orderId).catch(() => null)

        if (payRes?.success && payRes.paymentUrl) {
          //  Tạo đơn + payment thành công → redirect
          setMessages((prev) => [...prev, {
            id: `a-confirm-${Date.now()}`, role: "assistant",
            content: `Đơn hàng đã được tạo! Đang chuyển bạn đến trang thanh toán ${providerLabel}...`,
            createdAt: new Date().toISOString(),
          }])
          toast.success(`Đơn hàng đã tạo — đang chuyển đến ${providerLabel}`)
          setTimeout(() => { window.location.href = payRes.paymentUrl! }, 800)
        } else {
          //  Tạo đơn xong nhưng payment thất bại → cancel đơn tự động
          await ordersService.cancelPendingOrder(res.orderId).catch(() => null)
          toast.error(`Không thể khởi tạo thanh toán ${providerLabel}. Đơn hàng đã bị huỷ. Vui lòng thử lại.`)
          // Giữ nguyên confirmTarget để user retry với phương thức khác
          setOrderLoading(false)
          return
        }
      } else if (res.success && !res.orderId) {
        setMessages((prev) => [...prev, {
          id: `a-confirm-${Date.now()}`, role: "assistant",
          content: res.message,
          createdAt: new Date().toISOString(),
        }])
        toast.success("Tạo đơn hàng thành công")
      } else {
        toast.error(res.message || "Không thể tạo đơn hàng")
        setOrderLoading(false)
        return
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xác nhận đơn hàng")
      setOrderLoading(false)
      return
    }
    setOrderLoading(false)
    setConfirmTarget(null)
  }, [sessionId, confirmTarget, effectiveAddress, selectedAddressId, paymentMethod])

  const handleRejectOrder = useCallback(async () => {
    setConfirmTarget(null)
    if (!sessionId) return
    try {
      const res = await aiChatService.sendMessage(sessionId, "Tôi không muốn tạo đơn hàng lúc này")
      setMessages((prev) => [
        ...prev,
        { id: `u-reject-${Date.now()}`, role: "user", content: "Tôi không muốn tạo đơn hàng lúc này", createdAt: new Date().toISOString() },
        { id: `a-reject-${Date.now()}`, role: "assistant", content: res.reply, createdAt: new Date().toISOString(), responseMeta: res },
      ])
    } catch {
      toast.message("Đã bỏ qua bước xác nhận")
    }
  }, [sessionId])

  const handleNewConversation = useCallback(async () => {
    // Reset UI → boot lại session mới từ BE
    if (sessionId) sessionStorage.removeItem(`${AI_CHAT_CACHE_PREFIX}${sessionId}`)
    setMessages([])
    setConfirmTarget(null)
    setSelectedProductsByMessageId({})
    setInput("")
    setSessionId(null)
    setBooted(false)
    setView("chat")
  }, [sessionId])

  const openSession = useCallback(async (sid: string) => {
    setView("chat")
    // Nếu đây là session hiện tại, không fetch lại
    if (sid === sessionId) return

    setBootLoading(true)
    try {
      const res = await aiChatService.getSessionMessages(sid)
      if (res.success) {
        const cachedRaw = sessionStorage.getItem(`${AI_CHAT_CACHE_PREFIX}${sid}`)
        let cachedMessages: UiMessage[] = []
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { messages?: UiMessage[] }
            if (cached.messages?.length) cachedMessages = cached.messages
          } catch { /* ignore */ }
        }

        const beMessages: UiMessage[] = res.messages.map((m) => ({
          id: m.id, role: m.role, content: m.content, createdAt: m.createdAt,
        }))

        if (cachedMessages.length > 0) {
          const cachedIds = new Set(cachedMessages.map((m) => m.id))
          const extra = beMessages.filter((m) => !cachedIds.has(m.id))
          const merged = [...cachedMessages, ...extra].sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return ta - tb
          })
          setMessages(merged)
        } else {
          setMessages(beMessages)
        }

        setSessionId(sid)
        setConfirmTarget(null)
        setSelectedProductsByMessageId({})
        setBooted(true)
      }
    } catch { toast.error("Không thể tải cuộc trò chuyện") }
    finally { setBootLoading(false) }
  }, [sessionId])

  useEffect(() => {
    if (confirmTarget) setShowAddressPicker(false)
  }, [confirmTarget])

  if (authLoading || !token) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-[9998] flex items-center justify-center size-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          style={{
            bottom: "88px",
            right: "8px",
            background: "linear-gradient(135deg, var(--color-primary) 0%, #f59c2a 100%)",
          }}
          title="Trợ lý mua hàng"
        >
          <ShoppingBag className="text-white" size={22} />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="fixed z-[9998] flex flex-col rounded-2xl bg-white border shadow-2xl overflow-hidden"
          style={{
            bottom: "88px",
            right: "8px",
            width: view === "chat" ? "390px" : "310px",
            height: "560px",
            maxHeight: "80vh",
            borderColor: "#e5ded6",
            transition: "width 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5 border-b shrink-0"
            style={{ borderColor: "#e5ded6" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => { setView("list"); void loadSessions() }}
                  className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                  title="Danh sách cuộc trò chuyện"
                >
                  <ChevronLeft size={15} />
                </button>
              )}
              <ShopioAvatar size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-main)" }}>
                  {view === "list" ? "Trợ lý mua hàng" : "Trợ lý mua hàng"}
                </p>
                {view === "chat" && (
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-[10px] text-muted-foreground">Luôn sẵn sàng hỗ trợ</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {view === "list" && (
                <button
                  type="button"
                  onClick={() => void handleNewConversation()}
                  title="Cuộc trò chuyện mới"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors hover:bg-[#fdf6ee]"
                  style={{ borderColor: "#e0d2c2", color: "var(--color-primary)" }}
                >
                  <Plus size={12} /> Mới
                </button>
              )}
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => void handleNewConversation()}
                  title="Cuộc trò chuyện mới"
                  className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMinimized((v) => !v)}
                className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                title={minimized ? "Mở rộng" : "Thu nhỏ"}
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center size-7 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                title="Đóng"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── Sessions list view ── */}
              {view === "list" && (
                <div className="flex-1 overflow-y-auto" style={{ background: "#faf8f6" }}>
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center h-32 gap-2">
                      <div className="size-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                      <span className="text-xs text-muted-foreground">Đang tải...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
                      <MessageSquare size={32} className="text-gray-300" />
                      <p className="text-sm text-muted-foreground text-center">Chưa có cuộc trò chuyện nào</p>
                      <button
                        type="button"
                        onClick={() => void handleNewConversation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <Plus size={13} /> Bắt đầu trò chuyện
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {sessions.map((s) => (
                        <button
                          key={s.sessionId}
                          type="button"
                          onClick={() => void openSession(s.sessionId)}
                          className={`flex items-start gap-3 px-3 py-3 text-left border-b hover:bg-white transition-colors ${
                            s.sessionId === sessionId ? "bg-[#fdf6ee]" : ""
                          }`}
                          style={{ borderColor: "#f0e8de" }}
                        >
                          <ShopioAvatar size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-snug" style={{ color: "var(--color-text-main)" }}>
                              {s.title}
                            </p>
                            {s.lastMessage && (
                              <p className="text-[11px] truncate mt-0.5 text-muted-foreground">
                                {s.lastMessage.role === "user" ? "Bạn: " : "Trợ lý: "}
                                {s.lastMessage.content}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                            {formatSessionTime(s.updatedAt ?? s.createdAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Chat view ── */}
              {view === "chat" && (
              <>
              {/* Messages */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-3 py-3"
                style={{ background: "#faf8f6" }}
              >
                {bootLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="size-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                    <p className="text-xs text-muted-foreground">Đang kết nối...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-2">
                    <ShopioAvatar size="md" />
                    <p className="text-center text-sm font-medium" style={{ color: "var(--color-text-main)" }}>
                      Xin chào! Mình là trợ lý mua hàng.
                    </p>
                    <p className="text-center text-xs text-muted-foreground">
                      Mô tả món đồ bạn muốn, mình sẽ gợi ý sản phẩm phù hợp!
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 w-full">
                      {[
                        "Áo thun nam dưới 200k",
                        "Son môi đỏ đẹp",
                        "Laptop gaming tầm 15 triệu",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInput(s)}
                          className="w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors hover:bg-[#fdf6ee]"
                          style={{ borderColor: "#e7ddd2", color: "var(--color-text-secondary)" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && <ShopioAvatar size="xs" />}
                        <div className={`flex flex-col gap-0.5 max-w-[82%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                              m.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white border"
                            }`}
                            style={
                              m.role === "user"
                                ? { backgroundColor: "var(--color-primary)" }
                                : { borderColor: "#e8e0d6", color: "var(--color-text-main)" }
                            }
                          >
                            {/* Text */}
                            {!(m.role === "assistant" && m.responseMeta?.products?.length) && (
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            )}

                            {/* Product cards */}
                            {m.responseMeta?.products?.length ? (
                              <div className="flex flex-col gap-1.5">
                                {m.responseMeta.products.map((p) => {
                                  const sel = selectedProductsByMessageId[m.id]?.[p.id]
                                  const checked = sel?.checked ?? false
                                  const quantity = Math.max(1, Number(sel?.quantity) || 1)
                                  return (
                                    <div
                                      key={p.id}
                                      className="rounded-xl border bg-white overflow-hidden"
                                      style={{ borderColor: checked ? "#f3c97b" : "#ede5db" }}
                                    >
                                      <div className="flex items-start gap-2 p-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedProductsByMessageId((prev) => {
                                              const mm = prev[m.id] ?? {}
                                              const cur = mm[p.id] ?? { checked: false, quantity: 1 }
                                              return { ...prev, [m.id]: { ...mm, [p.id]: { checked: !cur.checked, quantity: Math.max(1, Number(cur.quantity) || 1) } } }
                                            })
                                          }
                                          className="mt-0.5 size-3.5 rounded border shrink-0 flex items-center justify-center"
                                          style={{
                                            borderColor: checked ? "var(--color-primary)" : "#c8bdb1",
                                            backgroundColor: checked ? "var(--color-primary)" : "transparent",
                                          }}
                                        >
                                          {checked && <Check size={8} className="text-white" strokeWidth={3} />}
                                        </button>
                                        <div className="size-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                          {p.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                                          ) : (
                                            <div className="size-full flex items-center justify-center">
                                              <ShoppingBag size={12} className="text-gray-300" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                          <p className="text-[11px] font-semibold line-clamp-2" style={{ color: "#2f2f2f" }}>{p.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{p.categoryName ?? "Sản phẩm gợi ý"}</p>
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                                              {formatPrice(p.basePrice)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-muted-foreground">SL</span>
                                              <input
                                                type="number" min={1} value={quantity}
                                                onChange={(e) => {
                                                  const nextQty = Math.max(1, Math.floor(Number(e.target.value) || 1))
                                                  setSelectedProductsByMessageId((prev) => {
                                                    const mm = prev[m.id] ?? {}
                                                    const cur = mm[p.id] ?? { checked: false, quantity: 1 }
                                                    return { ...prev, [m.id]: { ...mm, [p.id]: { checked: cur.checked, quantity: nextQty } } }
                                                  })
                                                }}
                                                className="h-5 w-10 rounded border px-1 text-[10px] focus:outline-none text-center"
                                                style={{ borderColor: "#e3d3b7" }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        className="flex items-center justify-end px-2 py-1 border-t"
                                        style={{ borderColor: "#f0e8de", backgroundColor: "#fdfaf6" }}
                                      >
                                        <Link
                                          href={`/products/${p.slug || p.id}`}
                                          className="text-[10px] font-medium underline"
                                          style={{ color: "var(--color-primary)" }}
                                        >
                                          Xem chi tiết →
                                        </Link>
                                      </div>
                                    </div>
                                  )
                                })}
                                {/* OK button */}
                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  <p className="text-[10px]" style={{ color: "#8a6a36" }}>
                                    Đã chọn {getSelectedProducts(m.id, m.responseMeta.products).length}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void handleApplySelectedProducts(m)}
                                    disabled={applyingSelectionMessageId === m.id || getSelectedProducts(m.id, m.responseMeta.products).length === 0}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[10px] font-medium disabled:opacity-50"
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                  >
                                    {applyingSelectionMessageId === m.id ? "Đang xử lý..." : <><CircleCheck size={10} /> Thêm vào giỏ</>}
                                  </button>
                                </div>
                                <p className="whitespace-pre-wrap text-xs pt-0.5">{m.content}</p>
                              </div>
                            ) : null}

                            {/* Confirm order */}
                            {confirmTarget?.messageId === m.id && (
                              <div
                                className="mt-2 rounded-xl border p-2.5 flex flex-col gap-1.5"
                                style={{ borderColor: "#f3d7ad", backgroundColor: "#fffcf5" }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <CircleCheck size={13} style={{ color: "#b07d2a" }} />
                                  <p className="text-[11px] font-semibold" style={{ color: "#7a5b29" }}>Xác nhận tạo đơn</p>
                                </div>
                                {(() => {
                                  const previews = confirmTarget.previews?.length ? confirmTarget.previews : confirmTarget.preview ? [confirmTarget.preview] : []
                                  if (!previews.length) return null
                                  return (
                                    <div className="rounded-lg border p-1.5 flex flex-col gap-1.5" style={{ borderColor: "#efddbf", backgroundColor: "white" }}>
                                      {previews.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex items-center gap-1.5">
                                          <div className="size-8 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                            {item.imageUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                                            ) : (
                                              <div className="size-full flex items-center justify-center"><ShoppingBag size={10} className="text-gray-300" /></div>
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium line-clamp-1" style={{ color: "#3d3d3d" }}>{item.name}</p>
                                            <p className="text-[10px]" style={{ color: "#8a6a36" }}>SL: {item.quantity} · {formatPrice(item.basePrice)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                })()}
                                {effectiveAddress && (
                                  <div>
                                    <div className="flex items-start gap-1" style={{ color: "#7a5b29" }}>
                                      <MapPin size={10} className="mt-0.5 shrink-0" />
                                      <p className="text-[10px] leading-snug">
                                        {effectiveAddress.fullName} — {effectiveAddress.addressLine1}, {effectiveAddress.city}
                                      </p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddressPicker((v) => !v)}
                                      className="flex items-center gap-0.5 text-[10px] font-medium mt-0.5" style={{ color: "var(--color-primary)" }}>
                                      <ChevronDown size={10} className={showAddressPicker ? "rotate-180" : ""} />
                                      {showAddressPicker ? "Ẩn" : "Đổi địa chỉ"}
                                    </button>
                                  </div>
                                )}
                                {!effectiveAddress && (
                                  <p className="text-[10px]" style={{ color: "#9b6a20" }}>
                                    Chưa có địa chỉ.{" "}
                                    <Link href="/user/profile/addresses" className="underline">Thêm ngay</Link>
                                  </p>
                                )}
                                {showAddressPicker && addresses.length > 0 && (
                                  <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}
                                    className="w-full h-7 rounded-lg border px-2 text-[10px] bg-white" style={{ borderColor: "#e3d3b7" }}>
                                    {addresses.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.fullName} — {a.addressLine1}, {a.city}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {/* Payment method selection */}
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold" style={{ color: "#7a5b29" }}>
                                    Phương thức thanh toán
                                  </p>
                                  <div className="flex gap-1.5">
                                    {PAYMENT_METHODS.map((pm) => {
                                      const active = paymentMethod === pm.id
                                      return (
                                        <button
                                          key={pm.id}
                                          type="button"
                                          onClick={() => setPaymentMethod(pm.id)}
                                          className="flex items-center gap-1.5 flex-1 rounded-lg border px-2 py-1.5 transition-colors"
                                          style={{
                                            borderColor: active ? "var(--color-primary)" : "#e0d2c2",
                                            backgroundColor: active ? "rgba(236,127,19,0.08)" : "white",
                                          }}
                                        >
                                          <div className="size-5 rounded overflow-hidden border bg-white shrink-0" style={{ borderColor: "#e8ddd1" }}>
                                            <Image src={pm.logo} alt={pm.label} width={20} height={20} className="size-full object-contain" />
                                          </div>
                                          <span className="text-[10px] font-semibold" style={{ color: active ? "var(--color-primary)" : "#5a4a3a" }}>
                                            {pm.label}
                                          </span>
                                          {active && <Check size={9} className="ml-auto shrink-0" style={{ color: "var(--color-primary)" }} />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button type="button" onClick={handleConfirmOrder} disabled={orderLoading}
                                    className="flex-1 py-1.5 rounded-lg text-white text-[10px] font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: "var(--color-primary)" }}>
                                    {orderLoading ? "Đang xử lý..." : "Đặt hàng & Thanh toán"}
                                  </button>
                                  <button type="button" onClick={handleRejectOrder} disabled={orderLoading}
                                    className="flex-1 py-1.5 rounded-lg border text-[10px]"
                                    style={{ borderColor: "#d9cdc0", color: "var(--color-text-secondary)" }}>
                                    Huỷ
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {m.createdAt && (
                            <span className="text-[10px] text-muted-foreground px-1">{formatTime(m.createdAt)}</span>
                          )}
                        </div>
                        {m.role === "user" && (
                          <div className="size-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-semibold"
                            style={{ backgroundColor: "#b07d2a" }}>
                            B
                          </div>
                        )}
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-2 justify-start">
                        <ShopioAvatar size="xs" />
                        <div className="rounded-2xl rounded-bl-sm bg-white border" style={{ borderColor: "#e8e0d6" }}>
                          <TypingDots />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t px-3 py-2.5 shrink-0" style={{ borderColor: "#e5ded6", background: "white" }}>
                <div
                  className="flex items-center gap-2 rounded-xl border px-3 py-1.5"
                  style={{ borderColor: "#d9cdc0" }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend() }
                    }}
                    placeholder="Nhập nhu cầu mua sắm..."
                    className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-gray-400"
                    style={{ color: "var(--color-text-main)" }}
                    disabled={sending || !sessionId || bootLoading}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !input.trim() || !sessionId || bootLoading}
                    className="flex items-center justify-center size-7 rounded-lg text-white disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
              </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
