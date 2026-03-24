'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { aiChatService, type AiChatSendResponse } from '@/services/ai-chat'
import { cartService } from '@/services/cart'
import { profileService } from '@/services/profile'
import type { AddressResponse } from '@/types/profile'

const CART_UPDATED_EVENT = 'cart:updated'
const AI_CHAT_CACHE_PREFIX = 'ai-chat-ui-state:'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
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
  return price.toLocaleString('vi-VN') + 'đ'
}

function isOrderRequestText(text: string) {
  return /tạo đơn|đặt đơn|checkout|thanh toán|mua luôn|chốt đơn/i.test(text)
}

export default function UserAiChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [bootLoading, setBootLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [selectedProductsByMessageId, setSelectedProductsByMessageId] = useState<
    Record<string, Record<string, ProductSelection>>
  >({})
  const [applyingSelectionMessageId, setApplyingSelectionMessageId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTargetState | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

  const loadAddresses = useCallback(async () => {
    try {
      const res = await profileService.getAddresses()
      if (res.success) {
        const list = res.data ?? []
        setAddresses(list)
        setSelectedAddressId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev
          return list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? ''
        })
      }
    } catch {
      // Non-blocking
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setBootLoading(true)
      try {
        const session = await aiChatService.getOrCreateSession()
        if (!mounted) return
        setSessionId(session.sessionId)
        const historyMessages: UiMessage[] =
          (session.history ?? []).map((m) => ({
            id: `${m.id}`,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        setMessages(historyMessages)

        const cachedRaw = sessionStorage.getItem(`${AI_CHAT_CACHE_PREFIX}${session.sessionId}`)
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as {
              messages?: UiMessage[]
              confirmTarget?: ConfirmTargetState | null
              selectedAddressId?: string
              selectedProductsByMessageId?: Record<string, Record<string, ProductSelection>>
            }
            if (cached.messages?.length) setMessages(cached.messages)
            if (cached.confirmTarget) setConfirmTarget(cached.confirmTarget)
            if (cached.selectedAddressId) setSelectedAddressId(cached.selectedAddressId)
            if (cached.selectedProductsByMessageId) {
              setSelectedProductsByMessageId(cached.selectedProductsByMessageId)
            }
          } catch {
            // ignore invalid cache
          }
        }
        await loadAddresses()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể khởi tạo AI chat'
        toast.error(msg)
      } finally {
        if (mounted) setBootLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [loadAddresses])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!sessionId) return
    const payload = JSON.stringify({
      messages,
      confirmTarget,
      selectedAddressId,
      selectedProductsByMessageId,
    })
    sessionStorage.setItem(`${AI_CHAT_CACHE_PREFIX}${sessionId}`, payload)
  }, [sessionId, messages, confirmTarget, selectedAddressId, selectedProductsByMessageId])

  const buildConfirmFromCart = useCallback(async (messageId: string, preferredProductId?: string, quantity = 1) => {
    const cart = await cartService.getMyCart().catch(() => null)
    if (!cart?.id || !cart.items?.length) return false

    const matched = preferredProductId
      ? cart.items.find((i) => i.productId === preferredProductId)
      : cart.items[0]
    if (!matched) return false

    setConfirmTarget({
      cartId: cart.id,
      messageId,
      preview: {
        id: matched.productId,
        name: matched.productName,
        imageUrl: matched.productImage,
        basePrice: matched.unitPrice,
        quantity,
      },
      previews: [
        {
          id: matched.productId,
          name: matched.productName,
          imageUrl: matched.productImage,
          basePrice: matched.unitPrice,
          quantity,
        },
      ],
    })
    return true
  }, [])

  const getSelectedProducts = useCallback(
    (messageId: string, products: NonNullable<UiMessage['responseMeta']>['products']) => {
      const selections = selectedProductsByMessageId[messageId] ?? {}
      return products
        .map((p) => {
          const selection = selections[p.id]
          if (!selection?.checked) return null
          return {
            ...p,
            quantity: Math.max(1, Number(selection.quantity) || 1),
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    },
    [selectedProductsByMessageId]
  )

  const handleApplySelectedProducts = useCallback(
    async (message: UiMessage) => {
      const products = message.responseMeta?.products ?? []
      if (!products.length) return

      const selectedItems = getSelectedProducts(message.id, products)
      if (!selectedItems.length) {
        toast.message('Bạn hãy tick ít nhất 1 sản phẩm trước khi bấm OK.')
        return
      }

      setApplyingSelectionMessageId(message.id)
      try {
        for (const item of selectedItems) {
          await cartService.addItem({
            productId: item.id,
            quantity: item.quantity,
          })
        }

        const cart = await cartService.getMyCart()
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))

        const first = selectedItems[0]
        const assistantConfirmMsgId = `a-bulk-confirm-${Date.now()}`
        setMessages((prev) => [
          ...prev,
          {
            id: assistantConfirmMsgId,
            role: 'assistant',
            content:
              selectedItems.length === 1
                ? `Mình đã thêm ${first.quantity} x "${first.name}" vào giỏ. Bạn có muốn tạo đơn ngay không?`
                : `Mình đã thêm ${selectedItems.length} sản phẩm bạn tick vào giỏ. Bạn có muốn tạo đơn ngay không?`,
            createdAt: new Date().toISOString(),
          },
        ])

        setConfirmTarget({
          cartId: cart.id,
          messageId: assistantConfirmMsgId,
          preview: {
            id: first.id,
            name: first.name,
            imageUrl: first.imageUrl,
            basePrice: first.basePrice,
            quantity: first.quantity,
          },
          previews: selectedItems.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            basePrice: item.basePrice,
            quantity: item.quantity,
          })),
        })

        toast.success(
          selectedItems.length === 1
            ? 'Đã thêm sản phẩm đã chọn vào giỏ'
            : `Đã thêm ${selectedItems.length} sản phẩm đã chọn vào giỏ`
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không thể thêm các sản phẩm đã chọn vào giỏ')
      } finally {
        setApplyingSelectionMessageId(null)
      }
    },
    [getSelectedProducts]
  )

  const handleSend = useCallback(async () => {
    if (!sessionId || !input.trim() || sending) return
    const msg = input.trim()

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await aiChatService.sendMessage(sessionId, msg)
      const resolvedCartId = res.cartId
      const fallbackAssistantReply = (res.products?.length ?? 0) > 0
        ? 'Mình đã tìm thấy sản phẩm phù hợp ở bên dưới.'
        : 'Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử thêm từ khóa ngành hàng, mức giá, thuộc tính hoặc thương hiệu để mình lọc chính xác hơn nhé.'

      const assistantMsg: UiMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.reply?.trim() || fallbackAssistantReply,
        createdAt: new Date().toISOString(),
        responseMeta: { ...res, cartId: resolvedCartId },
      }

      setMessages((prev) => [...prev, assistantMsg])
      if (res.products?.length) {
        setSelectedProductsByMessageId((prev) => {
          const oldMap = prev[assistantMsg.id] ?? {}
          const nextMap = res.products.reduce<Record<string, ProductSelection>>((acc, product) => {
            acc[product.id] = {
              checked: oldMap[product.id]?.checked ?? false,
              quantity: oldMap[product.id]?.quantity ?? 1,
            }
            return acc
          }, {})

          return { ...prev, [assistantMsg.id]: nextMap }
        })
      }

      const shouldOpenConfirm =
        (res.needsConfirmation && res.intent === 'checkout') ||
        res.intent === 'checkout' ||
        isOrderRequestText(msg) ||
        /bạn có muốn.*tạo đơn|xác nhận.*đơn|tạo đơn hàng/i.test(res.reply)

      if (shouldOpenConfirm) {
        if (resolvedCartId) {
          setConfirmTarget({
            cartId: resolvedCartId,
            messageId: assistantMsg.id,
            preview: undefined,
            previews: undefined,
          })
        } else {
          const ok = await buildConfirmFromCart(assistantMsg.id)
          if (!ok && isOrderRequestText(msg)) {
            toast.error('Hiện chưa có sản phẩm trong giỏ để tạo đơn')
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }, [sessionId, input, sending, buildConfirmFromCart])

  const handleConfirmOrder = useCallback(async () => {
    if (!sessionId) {
      toast.message('Phiên chat chưa sẵn sàng. Bạn thử gửi lại yêu cầu tạo đơn nhé.')
      return
    }

    setOrderLoading(true)
    try {
      const latestAddressRes = await profileService.getAddresses().catch(() => null)
      const latestAddresses = latestAddressRes?.success ? (latestAddressRes.data ?? []) : []
      if (latestAddresses.length > 0) {
        setAddresses(latestAddresses)
      }

      const resolvedAddress =
        latestAddresses.find((a) => a.id === selectedAddressId) ??
        latestAddresses.find((a) => a.isDefault) ??
        latestAddresses[0] ??
        effectiveAddress

      if (!resolvedAddress) {
        toast.message('Bạn chưa có địa chỉ giao hàng. Hãy bấm "Quản lý địa chỉ" để thêm địa chỉ trước khi tạo đơn.')
        return
      }

      if (resolvedAddress.id !== selectedAddressId) {
        setSelectedAddressId(resolvedAddress.id)
      }

      let cartId = confirmTarget?.cartId
      if (!cartId) {
        const currentCart = await cartService.getMyCart().catch(() => null)
        cartId = currentCart?.id
      }
      if (!cartId) {
        toast.message('Giỏ hàng hiện đang trống. Bạn hãy thêm sản phẩm trước khi tạo đơn.')
        return
      }

      const res = await aiChatService.confirmOrder(
        sessionId,
        cartId,
        resolvedAddress.id
      )
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-confirm-${Date.now()}`,
            role: 'assistant',
            content: res.message,
            createdAt: new Date().toISOString(),
          },
        ])
        toast.success('Tạo đơn hàng thành công từ AI chat')
      } else {
        toast.error(res.message || 'Không thể tạo đơn hàng')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận đơn hàng')
    } finally {
      setOrderLoading(false)
      setConfirmTarget(null)
    }
  }, [sessionId, confirmTarget, effectiveAddress, selectedAddressId])

  const handleRejectOrder = useCallback(async () => {
    setConfirmTarget(null)
    if (!sessionId) return
    try {
      const res = await aiChatService.sendMessage(sessionId, 'Tôi không muốn tạo đơn hàng lúc này')
      setMessages((prev) => [
        ...prev,
        {
          id: `u-reject-${Date.now()}`,
          role: 'user',
          content: 'Tôi không muốn tạo đơn hàng lúc này',
          createdAt: new Date().toISOString(),
        },
        {
          id: `a-reject-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          createdAt: new Date().toISOString(),
          responseMeta: res,
        },
      ])
    } catch {
      toast.message('Đã bỏ qua bước xác nhận tạo đơn')
    }
  }, [sessionId])

  useEffect(() => {
    if (confirmTarget) {
      setShowAddressPicker(false)
    }
  }, [confirmTarget])

  useEffect(() => {
    if (!confirmTarget) return
    const ownerMessage = messages.find((m) => m.id === confirmTarget.messageId)
    const products = ownerMessage?.responseMeta?.products ?? []
    if (!products.length) return
    const selectedId = getSelectedProducts(confirmTarget.messageId, products)[0]?.id
    if (!selectedId) return
    const picked = products.find((p) => p.id === selectedId)
    if (!picked) return

    setConfirmTarget((prev) => {
      if (!prev || prev.messageId !== confirmTarget.messageId) return prev
      const prevPreview = prev.preview
      if (
        prevPreview &&
        prevPreview.id === picked.id &&
        prevPreview.imageUrl === picked.imageUrl &&
        prevPreview.basePrice === picked.basePrice &&
        prevPreview.name === picked.name
      ) {
        return prev
      }
      return {
        ...prev,
        preview: {
          id: picked.id,
          name: picked.name,
          imageUrl: picked.imageUrl,
          basePrice: picked.basePrice,
          quantity:
            getSelectedProducts(confirmTarget.messageId, products).find((item) => item.id === picked.id)
              ?.quantity ?? prev.preview?.quantity ?? 1,
        },
        previews: [
          {
            id: picked.id,
            name: picked.name,
            imageUrl: picked.imageUrl,
            basePrice: picked.basePrice,
            quantity:
              getSelectedProducts(confirmTarget.messageId, products).find((item) => item.id === picked.id)
                ?.quantity ?? prev.preview?.quantity ?? 1,
          },
        ],
      }
    })
  }, [confirmTarget, messages, getSelectedProducts])

  const handleNewConversation = useCallback(() => {
    if (!sessionId) return
    setMessages([])
    setConfirmTarget(null)
    setSelectedProductsByMessageId({})
    setInput('')
    sessionStorage.removeItem(`${AI_CHAT_CACHE_PREFIX}${sessionId}`)
  }, [sessionId])

  if (bootLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="size-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5ded6' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: '#e5ded6' }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
            Trợ lý mua sắm AI
          </p>
          <p className="text-xs text-muted-foreground">
            AI tư vấn sản phẩm, gợi ý shop và hỗ trợ tạo đơn khi bạn đồng ý.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleNewConversation}
            className="px-2.5 py-1 rounded border text-[11px]"
            style={{ borderColor: '#e0d2c2', color: 'var(--color-text-secondary)' }}
          >
            Cuộc chat mới
          </button>
          <Link href="/user/profile/addresses" className="text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>
            Quản lý địa chỉ
          </Link>
        </div>
      </div>

      <div ref={listRef} className="h-[60vh] overflow-y-auto px-4 py-4 space-y-3 bg-[#fcfbfa]">
        {messages.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Hãy mô tả món đồ bạn muốn mua, ví dụ: &quot;Tôi cần áo thun nam dưới 200k&quot;
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'text-white'
                  : 'bg-white border'
              }`}
              style={
                m.role === 'user'
                  ? { backgroundColor: 'var(--color-primary)' }
                  : { borderColor: '#e5ded6', color: 'var(--color-text-main)' }
              }
            >
              {!(m.role === 'assistant' && m.responseMeta?.products?.length) && (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {m.responseMeta?.intent === 'checkout' && confirmTarget?.messageId !== m.id && (
                <p className="mt-2 text-[11px] text-[#8a6a36]">
                  Lưu ý: để tạo đơn thành công, bạn cần bấm xác nhận ở khối bên dưới.
                </p>
              )}

              {m.responseMeta?.products?.length ? (
                <div className="mt-3 space-y-2">
                  {m.responseMeta.products.map((p) => {
                    const selection = selectedProductsByMessageId[m.id]?.[p.id]
                    const checked = selection?.checked ?? false
                    const quantity = Math.max(1, Number(selection?.quantity) || 1)

                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border bg-white px-2.5 py-2"
                        style={{ borderColor: checked ? '#f3d7ad' : '#eee6de' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProductsByMessageId((prev) => {
                                const messageMap = prev[m.id] ?? {}
                                const current = messageMap[p.id] ?? { checked: false, quantity: 1 }
                                return {
                                  ...prev,
                                  [m.id]: {
                                    ...messageMap,
                                    [p.id]: {
                                      checked: !current.checked,
                                      quantity: Math.max(1, Number(current.quantity) || 1),
                                    },
                                  },
                                }
                              })
                            }
                            className="mt-1 size-4 rounded border shrink-0 flex items-center justify-center"
                            style={{
                              borderColor: checked ? 'var(--color-primary)' : '#d1c5b8',
                              backgroundColor: checked ? 'rgba(236,127,19,0.12)' : 'transparent',
                            }}
                            aria-label={`Chọn ${p.name}`}
                          >
                            {checked && (
                              <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--color-primary)' }}>
                                check
                              </span>
                            )}
                          </button>
                          <div className="size-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-gray-400 text-[10px]">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold line-clamp-2 text-[#2f2f2f]">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{p.categoryName ?? 'Sản phẩm gợi ý'}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <label className="text-[11px] text-muted-foreground">SL</label>
                              <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => {
                                  const parsed = Number(e.target.value)
                                  const nextQty = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1
                                  setSelectedProductsByMessageId((prev) => {
                                    const messageMap = prev[m.id] ?? {}
                                    const current = messageMap[p.id] ?? { checked: false, quantity: 1 }
                                    return {
                                      ...prev,
                                      [m.id]: {
                                        ...messageMap,
                                        [p.id]: {
                                          checked: current.checked,
                                          quantity: nextQty,
                                        },
                                      },
                                    }
                                  })
                                }}
                                className="h-7 w-16 rounded border px-2 text-[11px] focus:outline-none"
                                style={{ borderColor: '#e3d3b7' }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[var(--color-primary)]">
                            {formatPrice(p.basePrice)}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Link
                            href={`/products/${p.slug || p.id}`}
                            className="text-[11px] underline"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#8a6a36]">
                      Đã chọn{' '}
                      {getSelectedProducts(m.id, m.responseMeta.products).length}
                      {' '}sản phẩm
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleApplySelectedProducts(m)}
                      disabled={
                        applyingSelectionMessageId === m.id ||
                        getSelectedProducts(m.id, m.responseMeta.products).length === 0
                      }
                      className="px-3 py-1.5 rounded text-white text-[11px] disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {applyingSelectionMessageId === m.id ? 'Đang xử lý...' : 'OK'}
                    </button>
                  </div>
                </div>
              ) : null}
              {m.role === 'assistant' && Boolean(m.responseMeta?.products?.length) && (
                <p className="whitespace-pre-wrap mt-2">{m.content}</p>
              )}

              {confirmTarget?.messageId === m.id && (
                <div className="mt-3 rounded-lg border bg-[#fffaf3] p-2.5" style={{ borderColor: '#f3d7ad' }}>
                  <p className="text-[12px] font-semibold text-[#7a5b29]">Xác nhận tạo đơn hàng</p>
                  <p className="text-[12px] mt-1 text-[#7a5b29]">
                    Bạn có đồng ý tạo đơn hàng từ giỏ hiện tại không?
                  </p>
                  {(() => {
                    const confirmPreviews =
                      confirmTarget.previews?.length
                        ? confirmTarget.previews
                        : confirmTarget.preview
                          ? [confirmTarget.preview]
                          : []
                    if (!confirmPreviews.length) return null

                    return (
                      <div className="mt-2 rounded-md border bg-white p-2 space-y-2" style={{ borderColor: '#efddbf' }}>
                        {confirmPreviews.map((item, index) => (
                          <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                            <div className="size-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="size-full flex items-center justify-center text-gray-400 text-[10px]">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-[#3d3d3d] line-clamp-2">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#8a6a36]">
                                SL: {item.quantity} · {formatPrice(item.basePrice)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {!effectiveAddress && (
                    <p className="text-[11px] mt-1 text-[#9b6a20]">
                      Bạn chưa có địa chỉ giao hàng. Hãy thêm địa chỉ để hệ thống có thể tạo đơn cho bạn.
                    </p>
                  )}
                  {effectiveAddress && (
                    <div className="mt-2 rounded-md border bg-white p-2" style={{ borderColor: '#efddbf' }}>
                      <p className="text-[11px] text-[#8a6a36]">
                        Giao đến: {effectiveAddress.fullName ?? 'Người nhận'} - {effectiveAddress.addressLine1}, {effectiveAddress.ward ?? ''}, {effectiveAddress.district ?? ''}, {effectiveAddress.city}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddressPicker((prev) => !prev)}
                        className="mt-1 text-[11px] underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {showAddressPicker ? 'Ẩn đổi địa chỉ' : 'Đổi địa chỉ'}
                      </button>
                    </div>
                  )}
                  {showAddressPicker && addresses.length > 0 && (
                    <div className="mt-2">
                      <label className="text-[11px] text-[#8a6a36]">Chọn địa chỉ khác</label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1 w-full h-8 rounded border px-2 text-xs bg-white"
                        style={{ borderColor: '#e3d3b7' }}
                      >
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.fullName ?? 'Người nhận'} - {addr.addressLine1}, {addr.ward ?? ''}, {addr.district ?? ''}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={orderLoading}
                      className="px-3 py-1.5 rounded text-white text-xs disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {orderLoading ? 'Đang tạo...' : 'Đồng ý tạo đơn'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectOrder}
                      disabled={orderLoading}
                      className="px-3 py-1.5 rounded text-xs border"
                      style={{ borderColor: '#d9cdc0', color: 'var(--color-text-secondary)' }}
                    >
                      Không đồng ý
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-3" style={{ borderColor: '#e5ded6' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Nhập nhu cầu mua sắm của bạn..."
            className="flex-1 h-10 rounded-md border px-3 text-sm focus:outline-none"
            style={{ borderColor: '#d9cdc0' }}
            disabled={sending || !sessionId}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim() || !sessionId}
            className="h-10 px-4 rounded text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  )
}
