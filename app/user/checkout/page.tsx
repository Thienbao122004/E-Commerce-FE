'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cartService, type Cart, type CartItem } from '@/services/cart'
import { profileService } from '@/services/profile'
import { paymentsService, type CreatePaymentResponse } from '@/services/payments'
import type { AddressResponse } from '@/types/profile'
import { formatPhoneVn, formatPriceVND as formatPrice } from '@/lib/formatters'
import {
  writePendingPaymentSession,
  type PendingPaymentMethod,
} from '@/lib/pending-payment-session'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { getShopStorefrontPath } from '@/lib/shop-routes'
import { useGHNShippingFee } from '@/hooks/useGHNShippingFee'
import { CheckoutAddressModal } from './_components/CheckoutAddressModal'
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Store,
  StoreIcon,
  Truck,
} from 'lucide-react'

const CHECKOUT_SELECTED_IDS_KEY = 'checkout:selected-item-ids'

type PaymentMethod = PendingPaymentMethod

type CartItemWithShop = CartItem

interface ShopGroup {
  key: string
  shopId?: string
  shopName: string
  shopSlug?: string | null
  items: CartItemWithShop[]
  subtotal: number
  shippingFee: number
  total: number
  itemCount: number
  ghnShopId?: number | null
  fromDistrictId?: number | null
  fromWardCode?: string | null
}

function formatAddress(address: AddressResponse) {
  const parts = [
    address.addressLine1,
    address.ward,
    address.district,
    address.city,
    address.province,
  ].filter(Boolean)

  return parts.join(', ')
}

function getAddressDisplayName(address: AddressResponse) {
  return address.fullName || address.label || 'Người nhận'
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod
  label: string
  desc: string
  logo: string
}> = [
    {
      id: 'vnpay',
      label: 'VNPay',
      desc: 'Thanh toán online qua cổng VNPay bảo mật',
      logo: '/vnpay-logo.png',
    },
    {
      id: 'momo',
      label: 'MoMo',
      desc: 'Ví điện tử MoMo',
      logo: '/momo-logo.png',
    },
  ]

export default function CheckoutPage() {
  const router = useRouter()
  const { session } = useAuth()

  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [cart, setCart] = useState<Cart | null>(null)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay')
  const [checkoutItems, setCheckoutItems] = useState<CartItemWithShop[]>([])
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const reloadAddresses = useCallback(async () => {
    try {
      const res = await profileService.getAddresses()
      if (res.success) {
        setAddresses(res.data ?? [])
      }
    } catch {
      toast.error('Không thể tải lại danh sách địa chỉ')
    }
  }, [])

  const enrichItemsWithShop = useCallback((items: CartItem[]): CartItemWithShop[] => {
    return items.map((item) => ({
      ...item,
      shopName: item.shopName ?? 'Shop không xác định',
    }))
  }, [])

  const loadCheckoutData = useCallback(async () => {
    setLoading(true)
    try {
      const [cartRes, addressesRes] = await Promise.all([
        cartService.getMyCart(),
        profileService.getAddresses(),
      ])

      const cartData = cartRes ?? null
      const addressList = addressesRes.success ? (addressesRes.data ?? []) : []

      setCart(cartData)
      setAddresses(addressList)

      const defaultAddress = addressList.find((address) => address.isDefault) ?? addressList[0]
      setSelectedAddressId(defaultAddress?.id ?? '')

      const allItems: CartItem[] = cartData?.items ?? []
      let selectedItemIds: string[] = []

      try {
        const raw = sessionStorage.getItem(CHECKOUT_SELECTED_IDS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            selectedItemIds = parsed.filter((id): id is string => typeof id === 'string')
          }
        }
      } catch {
        selectedItemIds = []
      }

      let itemsToCheckout = allItems
      if (selectedItemIds.length > 0) {
        const selectedSet = new Set(selectedItemIds)
        const filtered = allItems.filter((item) => selectedSet.has(item.id))
        if (filtered.length > 0) {
          itemsToCheckout = filtered
        }
      }

      const enrichedItems = enrichItemsWithShop(itemsToCheckout)
      setCheckoutItems(enrichedItems)
    } catch {
      toast.error('Không thể tải thông tin checkout')
      setCart(null)
      setAddresses([])
      setCheckoutItems([])
    } finally {
      setLoading(false)
    }
  }, [enrichItemsWithShop])

  useEffect(() => {
    void loadCheckoutData()
  }, [loadCheckoutData])

  const openSellerChat = useCallback(
    (e: React.MouseEvent, shopId: string | undefined) => {
      e.preventDefault()
      e.stopPropagation()
      if (!shopId) {
        toast.info('Chưa có mã shop để mở chat. Hãy thêm sản phẩm từ gian hàng hợp lệ.', { duration: 5000 })
        return
      }
      if (!session) {
        if (typeof window !== 'undefined') {
          const returnUrl = window.location.pathname + window.location.search
          router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
        } else {
          router.push('/login')
        }
        toast.info('Vui lòng đăng nhập để chat với người bán')
        return
      }
      window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { shopId } }))
    },
    [session, router],
  )

  const groupedByShop = useMemo<ShopGroup[]>(() => {
    const groupMap = new Map<string, ShopGroup>()

    checkoutItems.forEach((item, index) => {
      const normalizedShopName = item.shopName?.trim() || 'Shop không xác định'
      const key = item.shopId || normalizedShopName.toLowerCase() || `shop-${index}`

      const existing = groupMap.get(key)
      if (existing) {
        existing.items.push(item)
        existing.subtotal += item.lineTotal
        existing.itemCount += item.quantity
        if (!existing.shopSlug && item.shopSlug) {
          existing.shopSlug = item.shopSlug
        }
        return
      }

      groupMap.set(key, {
        key,
        shopId: item.shopId ?? undefined,
        shopName: normalizedShopName,
        shopSlug: item.shopSlug ?? undefined,
        items: [item],
        subtotal: item.lineTotal,
        shippingFee: 0,
        total: 0,
        itemCount: item.quantity,
        ghnShopId: item.ghnShopId,
        fromDistrictId: item.fromDistrictId,
        fromWardCode: item.fromWardCode,
      })
    })

    return Array.from(groupMap.values()).map((group) => ({
      ...group,
      total: group.subtotal + group.shippingFee,
    }))
  }, [checkoutItems])

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)

  const shopInputs = useMemo(
    () =>
      groupedByShop.map((group) => ({
        key: group.key,
        totalWeightGrams: group.items.reduce((sum, item) => sum + item.quantity * 500, 0),
        totalValue: group.subtotal,
        ghnShopId: group.ghnShopId,
        fromDistrictId: group.fromDistrictId,
        fromWardCode: group.fromWardCode,
      })),
    [groupedByShop],
  )

  const { shopFees, totalShippingFee, isCalculating, hasBlockingError } = useGHNShippingFee(
    shopInputs,
    selectedAddress,
  )

  const subtotalAmount = useMemo(
    () => groupedByShop.reduce((sum, group) => sum + group.subtotal, 0),
    [groupedByShop]
  )

  const summaryProductLines = useMemo(
    () =>
      checkoutItems.map((item) => ({
        key: item.id,
        label: item.productName,
        quantity: item.quantity,
        amount: item.lineTotal,
        image: item.productImage,
      })),
    [checkoutItems]
  )

  const shippingAmount = totalShippingFee

  const grandTotal = subtotalAmount + shippingAmount
  const totalProductCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (placingOrder) {
      return
    }

    if (!cart?.id) {
      toast.error('Giỏ hàng không hợp lệ')
      return
    }

    if (!selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }

    if (checkoutItems.length === 0) {
      toast.error('Không có sản phẩm để thanh toán')
      return
    }

    if (isCalculating) {
      toast.error('Vui lòng đợi tính phí vận chuyển (GHN) xong')
      return
    }

    if (hasBlockingError) {
      toast.error('Chưa tính được phí giao hàng. Kiểm tra địa chỉ, dịch vụ GHN, rồi thử lại.')
      return
    }

    for (const group of groupedByShop) {
      if (!group.shopId) continue
      const sf = shopFees.get(group.key)
      if (!sf || sf.fee == null) {
        toast.error('Thiếu phí vận chuyển cho đơn hàng. Thử tải lại trang hoặc đổi địa chỉ.')
        return
      }
    }

    setPlacingOrder(true)
    try {
      const shippingOptions = groupedByShop
        .filter((group) => !!group.shopId)
        .map((group) => {
          const sf = shopFees.get(group.key)
          const fee = sf?.fee
          if (fee == null) {
            return null
          }
          const estimatedDeliveryDate = sf?.leadTime
            ? new Date(sf.leadTime * 1000).toISOString()
            : null

          return {
            shopId: group.shopId!,
            shippingProvider: 'GHN',
            shippingServiceId: sf?.ghnServiceId ?? '53320',
            shippingFee: fee,
            estimatedDeliveryDate,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x != null)

      const checkoutRes = await cartService.checkout({
        cartId: cart.id,
        shippingAddressId: selectedAddressId,
        shippingOptions,
      })

      if (!checkoutRes.success || !checkoutRes.data?.success) {
        toast.error(checkoutRes.message || checkoutRes.data?.message || 'Đặt hàng thất bại')
        return
      }

      const orderIds = checkoutRes.data.orderIds ?? []
      sessionStorage.removeItem(CHECKOUT_SELECTED_IDS_KEY)

      if (orderIds.length > 0) {
        writePendingPaymentSession({
          orderIds,
          paymentMethod,
          primaryOrderId: orderIds[0],
        })
      }

      if (paymentMethod === 'vnpay' || paymentMethod === 'momo') {
        if (orderIds.length === 0) {
          toast.success('Đặt hàng thành công')
          router.push('/user/purchase')
          return
        }

        const gatewayLabel = paymentMethod === 'momo' ? 'MoMo' : 'VNPay'

        let paymentRes: CreatePaymentResponse
        if (paymentMethod === 'vnpay') {
          paymentRes = await paymentsService.createVNPayBatchPayment(orderIds)
        } else {
          paymentRes = orderIds.length > 1
            ? await paymentsService.createMoMoBatchPayment(orderIds)
            : await paymentsService.createMoMoPayment(orderIds[0])
        }
        if (!paymentRes.success || !paymentRes.paymentUrl) {
          toast.error(paymentRes.message || `Không thể tạo giao dịch ${gatewayLabel}`)
          router.push('/user/purchase?status=0&from=payment-create-failed')
          return
        }

        writePendingPaymentSession({
          orderIds,
          paymentMethod,
          primaryOrderId: orderIds[0],
          paymentUrl: paymentRes.paymentUrl,
          paymentId: paymentRes.paymentId,
        })

        window.location.href = paymentRes.paymentUrl
        return
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt hàng')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3" style={{ borderColor: '#e5ded6' }}>
          <div
            className="size-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-muted-foreground">Đang tải thông tin checkout...</p>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0 || checkoutItems.length === 0) {
    return (
      <div className="rounded border bg-white p-10" style={{ borderColor: '#e5ded6' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-[rgba(236,127,19,0.1)]">
            <span className="material-symbols-outlined text-[34px]" style={{ color: 'var(--color-primary)' }}>
              shopping_cart_off
            </span>
          </div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
            Không có sản phẩm để checkout
          </h2>
          <p className="text-sm text-muted-foreground">
            Vui lòng chọn sản phẩm trong giỏ hàng trước khi thanh toán.
          </p>
          <Link
            href="/user/cart"
            className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded border bg-white" style={{ borderColor: '#e5ded6' }}>
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: '#efe8de' }}>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[rgba(236,127,19,0.1)]">
                <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  Địa chỉ nhận hàng
                </h2>
                <p className="text-xs text-muted-foreground">Giao đúng địa chỉ để tránh thất lạc đơn</p>
              </div>
            </div>
            <button
              onClick={() => setAddressModalOpen(true)}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(236,127,19,0.08)]"
              style={{ borderColor: '#d9cec2', color: 'var(--color-primary)' }}
            >
              Thay đổi
            </button>
          </div>
          <div className="px-5 py-4">
            {selectedAddress ? (
              <div className="grid gap-2 text-sm">
                <p className="font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  {getAddressDisplayName(selectedAddress)}{' '}
                  {selectedAddress.phone ? `| ${formatPhoneVn(selectedAddress.phone)}` : ''}
                </p>
                <p className="text-muted-foreground">{formatAddress(selectedAddress)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn chưa có địa chỉ giao hàng</p>
            )}
          </div>
        </div>

          {groupedByShop.map((group) => (
          <div
            key={group.key}
            className="overflow-hidden rounded border bg-white"
            style={{ borderColor: '#e5ded6' }}
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: '#efe8de' }}>
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-[rgba(236,127,19,0.1)]">
                  <Store size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
                    {group.shopName}
                  </span>
                  <span className="text-xs text-muted-foreground">{group.itemCount} sản phẩm</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={(e) => openSellerChat(e, group.shopId)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[rgba(236,127,19,0.08)]"
                  style={{ borderColor: '#d9cec2', color: 'var(--color-primary)' }}
                >
                  <MessageCircle size={13} />
                  <span>Chat với người bán</span>
                </button>
                {(() => {
                  const href = getShopStorefrontPath(group.shopSlug, group.shopName)
                  if (!href) {
                    return (
                      <button
                        type="button"
                        onClick={() => toast.info('Không tìm thấy liên kết tới gian hàng.')}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ borderColor: '#d9cec2', color: 'var(--color-text-secondary)' }}
                      >
                        <StoreIcon size={13} />
                        <span>Xem chi tiết shop</span>
                      </button>
                    )
                  }
                  return (
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#d9cec2', color: 'var(--color-text-secondary)' }}
                    >
                      <StoreIcon size={13} />
                      <span>Xem chi tiết shop</span>
                    </Link>
                  )
                })()}
              </div>
            </div>

            <div className="hidden border-b px-5 py-3 text-xs text-muted-foreground md:grid md:grid-cols-[1fr_120px_100px_140px]" style={{ borderColor: '#f0e8df' }}>
              <span>Sản phẩm</span>
              <span className="text-right">Đơn giá</span>
              <span className="text-right">SL</span>
              <span className="text-right">Thành tiền</span>
            </div>

            <div className="divide-y" style={{ borderColor: '#f0e8df' }}>
              {group.items.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid items-center gap-3 md:grid-cols-[1fr_120px_100px_140px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-12 shrink-0 overflow-hidden rounded border bg-gray-50" style={{ borderColor: '#e5ded6' }}>
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center">
                            <span className="material-symbols-outlined text-[24px] text-muted-foreground">image</span>
                          </div>
                        )}
                      </div>
                      <div className="grid min-w-0 gap-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground">Phân loại: {item.variantName}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm" style={{ color: 'var(--color-text-main)' }}>
                      {formatPrice(item.unitPrice)}
                    </div>

                    <div className="text-right text-sm" style={{ color: 'var(--color-text-main)' }}>
                      {item.quantity}
                    </div>

                    <div className="text-right text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t px-5 py-4" style={{ borderColor: '#efe8de' }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <Truck size={15} className="shrink-0" />
                  <span>Phí vận chuyển (GHN)</span>
                </div>
                {(() => {
                  const sf = shopFees.get(group.key)
                  if (!sf || sf.loading) {
                    return (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground sm:ml-auto">
                        <Loader2 size={12} className="animate-spin" />
                        Đang tính phí…
                      </span>
                    )
                  }
                  if (sf.error) {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200 sm:ml-auto">
                        <AlertCircle size={12} className="shrink-0" />
                        <span className="text-right">Không tính được phí</span>
                      </span>
                    )
                  }
                  return (
                    <span className="font-medium sm:ml-auto" style={{ color: 'var(--color-text-main)' }}>
                      {formatPrice(sf.fee ?? 0)}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>
        ))}

      </div>

      <div className="h-fit rounded border bg-white p-5 lg:sticky lg:top-24" style={{ borderColor: '#e5ded6' }}>
        <div className="grid gap-4">
          <div className="overflow-hidden bg-white" style={{ borderColor: '#e7e2db' }}>
            <div className="border-b px-2 py-3" style={{ borderColor: '#e4ddd4' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-main)' }}>
                Phương thức thanh toán
              </h3>
            </div>
            <div className="grid gap-2 py-3">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method.id
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
                    style={{
                      borderColor: active ? 'var(--color-primary)' : '#d1c9c0',
                      backgroundColor: active ? 'rgba(236,127,19,0.08)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md border bg-white" style={{ borderColor: '#e8ddd1' }}>
                        <Image
                          src={method.logo}
                          alt={`${method.label} logo`}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                      </div>
                      <div className="grid gap-0.5">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
                          {method.label}
                        </span>
                        <p className="text-[11px] text-muted-foreground">{method.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: active ? 'var(--color-primary)' : '#8a8178' }} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid overflow-hidden rounded-xl border bg-[#fafafa]" style={{ borderColor: '#e7e2db' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: '#e4ddd4' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-main)' }}>
                Tóm tắt đơn hàng
              </h3>
            </div>

            <div className="grid gap-2 border-b px-4 py-3" style={{ borderColor: '#e4ddd4' }}>
              {summaryProductLines.map((line) => (
                <div key={line.key} className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-xs text-muted-foreground">
                      x{line.quantity} {line.label}
                    </span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-main)' }}>
                    {formatPrice(line.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 border-b px-4 py-3 text-sm" style={{ borderColor: '#e4ddd4' }}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng tiền hàng</span>
                <span style={{ color: 'var(--color-text-main)' }}>{formatPrice(subtotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                {isCalculating ? (
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    Đang tính…
                  </span>
                ) : hasBlockingError ? (
                  <span className="text-xs text-amber-800 dark:text-amber-200">Không tính được</span>
                ) : (
                  <span style={{ color: 'var(--color-text-main)' }}>{formatPrice(shippingAmount)}</span>
                )}
              </div>
            </div>

            <div className="border-t bg-white px-4 py-4" style={{ borderColor: '#e4ddd4' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-main)' }}>
                  Tổng thanh toán
                </span>
                {isCalculating ? (
                  <span className="text-xl font-bold text-muted-foreground" aria-hidden>
                    —
                  </span>
                ) : hasBlockingError ? (
                  <span className="text-right text-sm font-semibold text-amber-800 dark:text-amber-200">—</span>
                ) : (
                  <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatPrice(grandTotal)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border p-3" style={{ borderColor: '#efe8de' }}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} />
              <span>Thông tin đơn hàng được bảo mật</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Nhấn “Đặt hàng” đồng nghĩa với việc bạn đồng ý tuân theo điều khoản của hệ thống.
            </p>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddress || isCalculating || hasBlockingError}
            className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {placingOrder ? 'Đang xử lý...' : `Đặt hàng (${totalProductCount} sản phẩm)`}
          </button>
        </div>
      </div>

      <CheckoutAddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
        onAddressUpdated={reloadAddresses}
      />
    </div>
  )
}
