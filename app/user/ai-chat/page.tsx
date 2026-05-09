'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Send,
  MapPin,
  RotateCcw,
  ShoppingBag,
  ChevronDown,
  Check,
  CircleCheck,
  Plus,
} from 'lucide-react'
import {
  aiChatService,
  type AiChatSendResponse,
  type AiChatShopShippingOption,
} from '@/services/ai-chat'
import { cartService } from '@/services/cart'
import { profileService } from '@/services/profile'
import { useGHNShippingFee } from '@/hooks/useGHNShippingFee'
import type { Cart } from '@/types/cart'
import { formatPriceVND as formatPrice, formatTimeVN as formatTime } from '@/lib/formatters'
import { readAiChatUiCache, writeAiChatUiCache, removeAiChatUiCache } from '@/lib/ai-chat-ui-cache'
import { dedupeMergedChatMessages } from '@/lib/ai-chat-merge-messages'
import { defaultVariantIdForProduct, mapHistoryMessageToUi } from '@/lib/ai-chat-map-history'
import { extractFirstQuantityFromUserText, resolveAutoAddToCartPayload } from '@/lib/ai-chat-auto-add-cart'
import { sanitizeAiAssistantDisplayText } from '@/lib/ai-chat-sanitize-reply'
import {
  isOrderIntentUserMessage,
  findLastAssistantWithProducts,
  buildImplicitCartLinesFromLastCard,
} from '@/lib/ai-chat-order-intent'
import type { AddressResponse } from '@/types/profile'

const CART_UPDATED_EVENT = 'cart:updated'

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
  variantId?: string
}

type ConfirmTargetState = {
  cartId?: string
  messageId: string
  preview?: ConfirmPreview
  previews?: ConfirmPreview[]
}

function ShopioAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'size-7' : size === 'md' ? 'size-9' : 'size-12'
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0`}
      style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #f59c2a 100%)' }}
    >
      <ShoppingBag size={iconSize} className="text-white" />
    </div>
  )
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: '#c4b8aa',
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  )
}

/* ─── Welcome message ─── */
function WelcomeScreen() {
  const suggestions = [
    'Tôi cần áo thun nam dưới 200k',
    'Tìm giúp tôi son môi đỏ',
    'Laptop gaming tầm 15 triệu',
    'Đồ ăn vặt ngon ngon',
  ]
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="flex flex-col items-center gap-3">
        <ShopioAvatar size="lg" />
        <div className="text-center">
          <p className="font-semibold text-base" style={{ color: 'var(--color-text-main)' }}>
            Trợ lý mua hàng
          </p>
          <p className="text-sm text-muted-foreground">
            Mô tả món đồ bạn muốn, mình sẽ tìm sản phẩm phù hợp nhất!
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-xl border px-3 py-2.5 text-left text-xs leading-snug transition-colors hover:bg-[#fdf6ee]"
            style={{ borderColor: '#e7ddd2', color: 'var(--color-text-secondary)' }}
            onClick={() => {
              const input = document.getElementById('shopio-chat-input') as HTMLInputElement | null
              if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
                nativeInputValueSetter?.call(input, s)
                input.dispatchEvent(new Event('input', { bubbles: true }))
                input.focus()
              }
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
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
  const [currentCart, setCurrentCart] = useState<Cart | null>(null)
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

  // Gom item trong giỏ theo shop để tính phí GHN — Main API yêu cầu shippingOptions
  // theo từng shop trước khi cho phép tạo đơn.
  const cartShopGroups = useMemo(() => {
    if (!currentCart?.items?.length) return [] as Array<{
      key: string
      shopId?: string
      totalWeightGrams: number
      totalValue: number
      ghnShopId?: number | null
      fromDistrictId?: number | null
      fromWardCode?: string | null
    }>
    const map = new Map<string, {
      key: string
      shopId?: string
      totalWeightGrams: number
      totalValue: number
      ghnShopId?: number | null
      fromDistrictId?: number | null
      fromWardCode?: string | null
    }>()
    currentCart.items.forEach((item, idx) => {
      const normalizedShopName = item.shopName?.trim() || 'Shop không xác định'
      const key = item.shopId || normalizedShopName.toLowerCase() || `shop-${idx}`
      const weight = item.quantity * 500
      const existing = map.get(key)
      if (existing) {
        existing.totalWeightGrams += weight
        existing.totalValue += item.lineTotal
      } else {
        map.set(key, {
          key,
          shopId: item.shopId ?? undefined,
          totalWeightGrams: weight,
          totalValue: item.lineTotal,
          ghnShopId: item.ghnShopId ?? null,
          fromDistrictId: item.fromDistrictId ?? null,
          fromWardCode: item.fromWardCode ?? null,
        })
      }
    })
    return Array.from(map.values())
  }, [currentCart])

  const ghnShopInputs = useMemo(
    () =>
      cartShopGroups.map((g) => ({
        key: g.key,
        totalWeightGrams: g.totalWeightGrams,
        totalValue: g.totalValue,
        ghnShopId: g.ghnShopId,
        fromDistrictId: g.fromDistrictId,
        fromWardCode: g.fromWardCode,
      })),
    [cartShopGroups]
  )

  const { shopFees, isCalculating: ghnCalculating, hasBlockingError: ghnHasError } =
    useGHNShippingFee(ghnShopInputs, effectiveAddress ?? undefined)

  const refreshCurrentCart = useCallback(async () => {
    try {
      const cart = await cartService.getMyCart()
      setCurrentCart(cart ?? null)
    } catch {
      setCurrentCart(null)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentCart()
    const onCartUpdated = () => void refreshCurrentCart()
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
  }, [refreshCurrentCart])

  useEffect(() => {
    if (!confirmTarget?.cartId) return
    void refreshCurrentCart()
  }, [confirmTarget?.cartId, refreshCurrentCart])

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

        const beMessages: UiMessage[] = (session.history ?? []).map((m) =>
          mapHistoryMessageToUi(session.sessionId, {
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            products: m.products,
          })
        )

        let cachedMessages: UiMessage[] = []
        const cachedRaw = readAiChatUiCache(session.sessionId)
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
            if (cached.selectedProductsByMessageId) {
              setSelectedProductsByMessageId(cached.selectedProductsByMessageId)
            }
          } catch {
            // ignore
          }
        }

        if (cachedMessages.length > 0) {
          const cachedIds = new Set(cachedMessages.map((m) => m.id))
          const extraFromBe = beMessages.filter((m) => !cachedIds.has(m.id))
          setMessages(dedupeMergedChatMessages([...cachedMessages, ...extraFromBe]))
        } else {
          setMessages(dedupeMergedChatMessages(beMessages))
        }
        await loadAddresses()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể khởi tạo trợ lý'
        toast.error(msg)
      } finally {
        if (mounted) setBootLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [loadAddresses])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    if (!sessionId) return
    const payload = JSON.stringify({
      messages,
      confirmTarget,
      selectedAddressId,
      selectedProductsByMessageId,
    })
    writeAiChatUiCache(sessionId, payload)
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
          const quantity = Math.max(1, Number(selection.quantity) || 1)
          const variantId = selection.variantId ?? defaultVariantIdForProduct(p)
          return { ...p, quantity, variantId }
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

      const missingVariant = selectedItems.find(
        (it) => (it.variants?.length ?? 0) > 1 && !it.variantId
      )
      if (missingVariant) {
        toast.error(`Vui lòng chọn phân loại (size/màu) cho "${missingVariant.name}".`)
        return
      }

      setApplyingSelectionMessageId(message.id)
      try {
        for (const item of selectedItems) {
          await cartService.addItem({
            productId: item.id,
            quantity: item.quantity,
            ...(item.variantId ? { variantId: item.variantId } : {}),
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
        toast.error(err instanceof Error ? err.message : 'Không thể thêm sản phẩm vào giỏ')
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
    const thread = [...messages, userMsg]
    setMessages(thread)
    setInput('')
    setSending(true)

    try {
      const res = await aiChatService.sendMessage(sessionId, msg)
      const resolvedCartId = res.cartId
      const fallbackAssistantReply =
        (res.products?.length ?? 0) > 0
          ? 'Mình đã tìm thấy sản phẩm phù hợp ở bên dưới.'
          : 'Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử thêm từ khóa ngành hàng, mức giá, thuộc tính hoặc thương hiệu để mình lọc chính xác hơn nhé.'

      let assistantContent = sanitizeAiAssistantDisplayText((res.reply ?? '').trim() || fallbackAssistantReply)
      const assistantId = `a-${Date.now()}`

      const addPayload = resolveAutoAddToCartPayload(res, msg)
      let didAutoAddToCart = false
      if (addPayload) {
        try {
          await cartService.addItem({
            productId: addPayload.productId,
            quantity: addPayload.quantity,
            ...(addPayload.variantId ? { variantId: addPayload.variantId } : {}),
          })
          window.dispatchEvent(new Event(CART_UPDATED_EVENT))
          const cartWrap = await cartService.getMyCart()
          if (cartWrap?.id) {
            didAutoAddToCart = true
            const pp = res.products?.find((x) => x.id === addPayload.productId)
            setConfirmTarget({
              cartId: cartWrap.id,
              messageId: assistantId,
              preview: {
                id: addPayload.productId,
                name: pp?.name ?? 'Sản phẩm',
                imageUrl: pp?.imageUrl,
                basePrice: pp?.basePrice ?? 0,
                quantity: addPayload.quantity,
              },
              previews: [
                {
                  id: addPayload.productId,
                  name: pp?.name ?? 'Sản phẩm',
                  imageUrl: pp?.imageUrl,
                  basePrice: pp?.basePrice ?? 0,
                  quantity: addPayload.quantity,
                },
              ],
            })
          }
          toast.success('Đã thêm vào giỏ hàng')
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Không thể thêm vào giỏ hàng')
        }
      }

      if (!didAutoAddToCart && isOrderIntentUserMessage(msg)) {
        const lastCard = findLastAssistantWithProducts(thread.slice(0, -1))
        const prods = lastCard?.responseMeta?.products
        if (lastCard && prods?.length) {
          const lines = buildImplicitCartLinesFromLastCard(prods, selectedProductsByMessageId[lastCard.id], msg)
          if (lines?.length) {
            try {
              for (const row of lines) {
                await cartService.addItem({
                  productId: row.productId,
                  quantity: row.quantity,
                  ...(row.variantId ? { variantId: row.variantId } : {}),
                })
              }
              window.dispatchEvent(new Event(CART_UPDATED_EVENT))
              const cartWrap = await cartService.getMyCart()
              if (cartWrap?.id) {
                didAutoAddToCart = true
                const first = lines[0]
                setConfirmTarget({
                  cartId: cartWrap.id,
                  messageId: assistantId,
                  preview: {
                    id: first.productId,
                    name: first.name,
                    imageUrl: first.imageUrl,
                    basePrice: first.basePrice,
                    quantity: first.quantity,
                  },
                  previews: lines.map((row) => ({
                    id: row.productId,
                    name: row.name,
                    imageUrl: row.imageUrl,
                    basePrice: row.basePrice,
                    quantity: row.quantity,
                  })),
                })
              }
              if (/chưa tìm thấy sản phẩm/i.test(assistantContent)) {
                assistantContent =
                  lines.length === 1
                    ? `Mình đã thêm ${lines[0].quantity} x "${lines[0].name}" vào giỏ. Bạn có muốn tạo đơn ngay không?`
                    : `Mình đã thêm ${lines.length} sản phẩm vào giỏ. Bạn có muốn tạo đơn ngay không?`
              }
              toast.success('Đã thêm vào giỏ hàng')
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Không thể thêm vào giỏ hàng')
            }
          } else {
            if (prods.length === 1) {
              toast.message('Chọn phân loại (size/hương vị) trên thẻ trước khi đặt hàng nhé.')
            } else {
              toast.message('Tick sản phẩm rồi bấm Thêm vào giỏ, hoặc chọn đủ phân loại rồi đặt hàng.')
            }
          }
        }
      }

      const assistantMsg: UiMessage = {
        id: assistantId,
        role: 'assistant',
        content: assistantContent || fallbackAssistantReply,
        createdAt: new Date().toISOString(),
        responseMeta: { ...res, cartId: resolvedCartId },
      }

      setMessages((prev) => [...prev, assistantMsg])
      if (res.products?.length) {
        const qtyHint = Math.max(1, extractFirstQuantityFromUserText(msg) ?? 1)
        setSelectedProductsByMessageId((prev) => {
          const oldMap = prev[assistantMsg.id] ?? {}
          const nextMap = res.products.reduce<Record<string, ProductSelection>>((acc, product) => {
            const old = oldMap[product.id]
            acc[product.id] = {
              checked: old?.checked ?? false,
              quantity: old?.quantity ?? qtyHint,
              variantId: old?.variantId ?? defaultVariantIdForProduct(product),
            }
            return acc
          }, {})
          return { ...prev, [assistantMsg.id]: nextMap }
        })
      }

      const shouldOpenConfirm =
        didAutoAddToCart ||
        (res.needsConfirmation && res.intent === 'checkout') ||
        res.intent === 'checkout' ||
        isOrderIntentUserMessage(msg) ||
        /bạn có muốn.*tạo đơn|xác nhận.*đơn|tạo đơn hàng/i.test(res.reply)

      if (shouldOpenConfirm) {
        if (didAutoAddToCart) {
          /* confirmTarget đã gán */
        } else if (resolvedCartId) {
          setConfirmTarget({ cartId: resolvedCartId, messageId: assistantMsg.id })
        } else {
          const ok = await buildConfirmFromCart(assistantMsg.id)
          if (!ok && isOrderIntentUserMessage(msg)) {
            toast.error('Hiện chưa có sản phẩm trong giỏ để tạo đơn')
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }, [sessionId, input, sending, buildConfirmFromCart, messages, selectedProductsByMessageId])

  const handleConfirmOrder = useCallback(async () => {
    if (!sessionId) {
      toast.message('Phiên chat chưa sẵn sàng. Bạn thử gửi lại yêu cầu tạo đơn nhé.')
      return
    }

    setOrderLoading(true)
    try {
      const latestAddressRes = await profileService.getAddresses().catch(() => null)
      const latestAddresses = latestAddressRes?.success ? (latestAddressRes.data ?? []) : []
      if (latestAddresses.length > 0) setAddresses(latestAddresses)

      const resolvedAddress =
        latestAddresses.find((a) => a.id === selectedAddressId) ??
        latestAddresses.find((a) => a.isDefault) ??
        latestAddresses[0] ??
        effectiveAddress

      if (!resolvedAddress) {
        toast.message('Bạn chưa có địa chỉ giao hàng. Hãy bấm "Quản lý địa chỉ" để thêm địa chỉ trước khi tạo đơn.')
        return
      }
      if (resolvedAddress.id !== selectedAddressId) setSelectedAddressId(resolvedAddress.id)

      let cartId = confirmTarget?.cartId
      if (!cartId) {
        const fresh = await cartService.getMyCart().catch(() => null)
        cartId = fresh?.id
        if (fresh) setCurrentCart(fresh)
      }
      if (!cartId) {
        toast.message('Giỏ hàng hiện đang trống. Bạn hãy thêm sản phẩm trước khi tạo đơn.')
        return
      }

      // Đảm bảo cart hiện hành đã đồng bộ với cartId trước khi build shippingOptions
      let cartForShipping = currentCart
      if (!cartForShipping || cartForShipping.id !== cartId) {
        const fresh = await cartService.getMyCart().catch(() => null)
        if (fresh) {
          setCurrentCart(fresh)
          cartForShipping = fresh
        }
      }
      if (!cartForShipping?.items?.length) {
        toast.error('Giỏ hàng trống, không thể tạo đơn.')
        return
      }

      if (ghnCalculating) {
        toast.message('Đang tính phí vận chuyển GHN, bạn đợi vài giây nhé.')
        return
      }
      if (ghnHasError) {
        toast.error('Chưa tính được phí giao hàng. Hãy đổi địa chỉ hoặc thử lại.')
        return
      }

      const shippingOptions: AiChatShopShippingOption[] = []
      for (const group of cartShopGroups) {
        if (!group.shopId) continue
        const sf = shopFees.get(group.key)
        if (!sf || sf.fee == null) {
          toast.error('Thiếu phí vận chuyển cho một shop trong giỏ. Tải lại hoặc đổi địa chỉ rồi thử lại.')
          return
        }
        shippingOptions.push({
          shopId: group.shopId,
          shippingProvider: 'GHN',
          shippingServiceId: sf.ghnServiceId ?? '53320',
          shippingFee: sf.fee,
          estimatedDeliveryDate: sf.leadTime
            ? new Date(sf.leadTime * 1000).toISOString()
            : null,
        })
      }

      if (shippingOptions.length === 0) {
        toast.error('Không xác định được shop trong giỏ để tính phí vận chuyển.')
        return
      }

      const res = await aiChatService.confirmOrder(sessionId, cartId, resolvedAddress.id, shippingOptions)
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
        toast.success('Tạo đơn hàng thành công')
      } else {
        toast.error(res.message || 'Không thể tạo đơn hàng')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận đơn hàng')
    } finally {
      setOrderLoading(false)
      setConfirmTarget(null)
    }
  }, [
    sessionId,
    confirmTarget,
    effectiveAddress,
    selectedAddressId,
    currentCart,
    cartShopGroups,
    shopFees,
    ghnCalculating,
    ghnHasError,
  ])

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
    if (confirmTarget) setShowAddressPicker(false)
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
      ) return prev
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
    removeAiChatUiCache(sessionId)
  }, [sessionId])

  /* ─── Loading screen ─── */
  if (bootLoading) {
    return (
      <div
        className="rounded-2xl border overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 130px)', borderColor: '#e5ded6' }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: '#e5ded6', background: 'white' }}
        >
          <ShopioAvatar size="md" />
          <div className="grid gap-1">
            <div className="h-3.5 w-36 rounded bg-gray-200 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#faf8f6]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="size-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-muted-foreground">Đang kết nối trợ lý...</p>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Main chat UI ─── */
  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 130px)', borderColor: '#e5ded6' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: '#e5ded6', background: 'white' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ShopioAvatar size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
              Trợ lý mua hàng
            </p>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-[11px] text-muted-foreground">Luôn sẵn sàng hỗ trợ</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/user/profile/addresses"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors hover:bg-[#fdf6ee]"
            style={{ borderColor: '#e0d2c2', color: 'var(--color-text-secondary)' }}
          >
            <MapPin size={12} />
            Địa chỉ
          </Link>
          <button
            type="button"
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors hover:bg-[#fdf6ee]"
            style={{ borderColor: '#e0d2c2', color: 'var(--color-text-secondary)' }}
            title="Cuộc trò chuyện mới"
          >
            <Plus size={12} /> Mới
            Mới
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: '#faf8f6' }}
      >
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && <ShopioAvatar size="sm" />}

                <div className={`flex flex-col gap-1 max-w-[78%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm bg-white border'
                    }`}
                    style={
                      m.role === 'user'
                        ? { backgroundColor: 'var(--color-primary)' }
                        : { borderColor: '#e8e0d6', color: 'var(--color-text-main)' }
                    }
                  >
                    {/* Text content */}
                    {!(m.role === 'assistant' && m.responseMeta?.products?.length) && (
                      <p className="whitespace-pre-wrap">
                        {m.role === 'assistant' ? sanitizeAiAssistantDisplayText(m.content) : m.content}
                      </p>
                    )}

                    {/* Product list */}
                    {m.responseMeta?.products?.length ? (
                      <div className="flex flex-col gap-2">
                        {m.responseMeta.products.map((p) => {
                          const selection = selectedProductsByMessageId[m.id]?.[p.id]
                          const checked = selection?.checked ?? false
                          const quantity = Math.max(1, Number(selection?.quantity) || 1)
                          const resolvedVariant = p.variants?.find((v) => String(v.id) === (selection?.variantId ?? ''))
                          const linePrice =
                            resolvedVariant?.price != null ? resolvedVariant.price : p.basePrice
                          const needVariantPick = (p.variants?.length ?? 0) > 1
                          const variantMissing = checked && needVariantPick && !selection?.variantId

                          return (
                            <div
                              key={p.id}
                              className="rounded-xl border bg-white overflow-hidden"
                              style={{ borderColor: checked ? '#f3c97b' : '#ede5db' }}
                            >
                              <div className="flex items-start gap-2.5 p-2.5">
                                {/* Checkbox */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedProductsByMessageId((prev) => {
                                      const messageMap = prev[m.id] ?? {}
                                      const current = messageMap[p.id] ?? {
                                        checked: false,
                                        quantity: 1,
                                        variantId: defaultVariantIdForProduct(p),
                                      }
                                      return {
                                        ...prev,
                                        [m.id]: {
                                          ...messageMap,
                                          [p.id]: {
                                            ...current,
                                            checked: !current.checked,
                                            quantity: Math.max(1, Number(current.quantity) || 1),
                                          },
                                        },
                                      }
                                    })
                                  }
                                  className="mt-0.5 size-4 rounded border shrink-0 flex items-center justify-center transition-colors"
                                  style={{
                                    borderColor: checked ? 'var(--color-primary)' : '#c8bdb1',
                                    backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
                                  }}
                                  aria-label={`Chọn ${p.name}`}
                                >
                                  {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                                </button>

                                {/* Product image */}
                                <div className="size-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                  {p.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                                  ) : (
                                    <div className="size-full flex items-center justify-center">
                                      <ShoppingBag size={16} className="text-gray-300" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                  <p className="text-xs font-semibold truncate" style={{ color: '#2f2f2f' }}>
                                    {p.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">{p.categoryName ?? 'Sản phẩm gợi ý'}</p>
                                  {needVariantPick ? (
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <span className="text-[10px] text-muted-foreground shrink-0">Phân loại:</span>
                                      {p.variants!.map((v) => {
                                        const vid = String(v.id)
                                        const picked = (selection?.variantId ?? '') === vid
                                        return (
                                          <button
                                            key={vid}
                                            type="button"
                                            onClick={() =>
                                              setSelectedProductsByMessageId((prev) => {
                                                const messageMap = prev[m.id] ?? {}
                                                const current = messageMap[p.id] ?? {
                                                  checked: false,
                                                  quantity: 1,
                                                  variantId: defaultVariantIdForProduct(p),
                                                }
                                                return {
                                                  ...prev,
                                                  [m.id]: {
                                                    ...messageMap,
                                                    [p.id]: { ...current, variantId: vid },
                                                  },
                                                }
                                              })
                                            }
                                            className="px-2 py-0.5 rounded text-[10px] font-medium border transition-colors"
                                            style={{
                                              borderColor: picked ? 'var(--color-primary)' : '#e3d3b7',
                                              backgroundColor: picked ? '#fff7ed' : '#fff',
                                              color: picked ? 'var(--color-primary)' : '#57534e',
                                            }}
                                          >
                                            {v.variantName}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  ) : null}
                                  {variantMissing ? (
                                    <p className="text-[10px] text-amber-700">Chọn phân loại trước khi thêm giỏ.</p>
                                  ) : null}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                                      {formatPrice(linePrice)}
                                    </span>
                                    <div className="flex items-center gap-1">
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
                                            const current = messageMap[p.id] ?? {
                                              checked: false,
                                              quantity: 1,
                                              variantId: defaultVariantIdForProduct(p),
                                            }
                                            return {
                                              ...prev,
                                              [m.id]: {
                                                ...messageMap,
                                                [p.id]: { ...current, quantity: nextQty },
                                              },
                                            }
                                          })
                                        }}
                                        className="h-6 w-12 rounded border px-1.5 text-[11px] focus:outline-none text-center"
                                        style={{ borderColor: '#e3d3b7' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="flex items-center justify-end px-2.5 py-1.5 border-t"
                                style={{ borderColor: '#f0e8de', backgroundColor: '#fdfaf6' }}
                              >
                                <Link
                                  href={`/products/${p.slug || p.id}`}
                                  className="text-[11px] font-medium underline"
                                  style={{ color: 'var(--color-primary)' }}
                                >
                                  Xem chi tiết →
                                </Link>
                              </div>
                            </div>
                          )
                        })}

                        {/* Apply selection row */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[11px]" style={{ color: '#8a6a36' }}>
                            Đã chọn {getSelectedProducts(m.id, m.responseMeta.products).length} sản phẩm
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleApplySelectedProducts(m)}
                            disabled={
                              applyingSelectionMessageId === m.id ||
                              getSelectedProducts(m.id, m.responseMeta.products).length === 0 ||
                              m.responseMeta.products.some((p) => {
                                const s = selectedProductsByMessageId[m.id]?.[p.id]
                                return Boolean(s?.checked && (p.variants?.length ?? 0) > 1 && !s?.variantId)
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-medium disabled:opacity-50 transition-opacity"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {applyingSelectionMessageId === m.id ? (
                              'Đang xử lý...'
                            ) : (
                              <>
                                <CircleCheck size={12} />
                                Thêm vào giỏ
                              </>
                            )}
                          </button>
                        </div>

                        {/* Text below products */}
                        <p className="whitespace-pre-wrap text-sm pt-1">
                          {sanitizeAiAssistantDisplayText(m.content)}
                        </p>
                      </div>
                    ) : null}

                    {/* Confirm order block */}
                    {confirmTarget?.messageId === m.id && (
                      <div
                        className="mt-3 rounded-xl border p-3 flex flex-col gap-2"
                        style={{ borderColor: '#f3d7ad', backgroundColor: '#fffcf5' }}
                      >
                        <div className="flex items-center gap-2">
                          <CircleCheck size={15} style={{ color: '#b07d2a' }} />
                          <p className="text-[12px] font-semibold" style={{ color: '#7a5b29' }}>
                            Xác nhận tạo đơn hàng
                          </p>
                        </div>
                        <p className="text-[12px]" style={{ color: '#7a5b29' }}>
                          Bạn có đồng ý tạo đơn từ giỏ hàng hiện tại không?
                        </p>

                        {/* Preview items */}
                        {(() => {
                          const confirmPreviews = confirmTarget.previews?.length
                            ? confirmTarget.previews
                            : confirmTarget.preview ? [confirmTarget.preview] : []
                          if (!confirmPreviews.length) return null
                          return (
                            <div
                              className="rounded-lg border p-2 flex flex-col gap-2"
                              style={{ borderColor: '#efddbf', backgroundColor: 'white' }}
                            >
                              {confirmPreviews.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                                  <div className="size-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    {item.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                                    ) : (
                                      <div className="size-full flex items-center justify-center">
                                        <ShoppingBag size={14} className="text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate" style={{ color: '#3d3d3d' }}>
                                      {item.name}
                                    </p>
                                    <p className="text-[11px]" style={{ color: '#8a6a36' }}>
                                      SL: {item.quantity} · {formatPrice(item.basePrice)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}

                        {/* Address */}
                        {!effectiveAddress && (
                          <p className="text-[11px]" style={{ color: '#9b6a20' }}>
                            Bạn chưa có địa chỉ giao hàng.{' '}
                            <Link href="/user/profile/addresses" className="underline">
                              Thêm địa chỉ
                            </Link>
                          </p>
                        )}
                        {effectiveAddress && (
                          <div
                            className="rounded-lg border px-2.5 py-2"
                            style={{ borderColor: '#efddbf', backgroundColor: 'white' }}
                          >
                            <div className="flex items-start gap-1.5">
                              <MapPin size={11} className="mt-0.5 shrink-0" style={{ color: '#b07d2a' }} />
                              <p className="text-[11px] leading-snug flex-1" style={{ color: '#7a5b29' }}>
                                {effectiveAddress.fullName ?? 'Người nhận'} — {effectiveAddress.addressLine1}, {effectiveAddress.ward ?? ''}, {effectiveAddress.district ?? ''}, {effectiveAddress.city}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddressPicker((prev) => !prev)}
                              className="mt-1 flex items-center gap-1 text-[11px] font-medium"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              <ChevronDown size={11} className={showAddressPicker ? 'rotate-180' : ''} />
                              {showAddressPicker ? 'Ẩn' : 'Đổi địa chỉ'}
                            </button>
                          </div>
                        )}
                        {showAddressPicker && addresses.length > 0 && (
                          <select
                            value={selectedAddressId}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="w-full h-8 rounded-lg border px-2 text-xs bg-white"
                            style={{ borderColor: '#e3d3b7' }}
                          >
                            {addresses.map((addr) => (
                              <option key={addr.id} value={addr.id}>
                                {addr.fullName ?? 'Người nhận'} — {addr.addressLine1}, {addr.ward ?? ''}, {addr.district ?? ''}, {addr.city}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleConfirmOrder}
                            disabled={orderLoading}
                            className="flex-1 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50 transition-opacity"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {orderLoading ? 'Đang tạo...' : 'Đồng ý tạo đơn'}
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectOrder}
                            disabled={orderLoading}
                            className="flex-1 py-2 rounded-lg text-xs border font-medium"
                            style={{ borderColor: '#d9cdc0', color: 'var(--color-text-secondary)' }}
                          >
                            Không đồng ý
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  {m.createdAt && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTime(m.createdAt)}
                    </span>
                  )}
                </div>

                {m.role === 'user' && (
                  <div
                    className="size-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
                    style={{ backgroundColor: '#b07d2a' }}
                  >
                    B
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-2.5 justify-start">
                <ShopioAvatar size="sm" />
                <div
                  className="rounded-2xl rounded-bl-sm bg-white border"
                  style={{ borderColor: '#e8e0d6' }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="border-t px-4 py-3 shrink-0"
        style={{ borderColor: '#e5ded6', background: 'white' }}
      >
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-shadow focus-within:shadow-sm"
          style={{ borderColor: '#d9cdc0' }}
        >
          <input
            id="shopio-chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Nhập nhu cầu mua sắm của bạn..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
            style={{ color: 'var(--color-text-main)' }}
            disabled={sending || !sessionId}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim() || !sessionId}
            className="flex items-center justify-center size-8 rounded-lg text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-label="Gửi tin nhắn"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-1.5">
          Trợ lý mua hàng · Có thể gợi ý sản phẩm và hỗ trợ đặt hàng
        </p>
      </div>
    </div>
  )
}
