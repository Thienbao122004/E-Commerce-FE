'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cartService, type Cart, type CartItem } from '@/services/cart'
import { profileService } from '@/services/profile'
import { paymentsService } from '@/services/payments'
import type { AddressResponse } from '@/types/profile'
import { getProductById } from '@/services/storefront-products'
import { formatPriceVND as formatPrice } from '@/lib/formatters'
import { toast } from 'sonner'
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Store,
  StoreIcon,
  Truck,
} from 'lucide-react'

const CHECKOUT_SELECTED_IDS_KEY = 'checkout:selected-item-ids'
const SHIPPING_FEE_PER_SHOP = 30000

type PaymentMethod = 'vnpay' | 'momo'

type CartItemWithShop = CartItem & {
  shopId?: string
  shopName?: string
}

interface ShopGroup {
  key: string
  shopId?: string
  shopName: string
  items: CartItemWithShop[]
  subtotal: number
  shippingFee: number
  total: number
  itemCount: number
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

  const [loading, setLoading] = useState(true)
  const [loadingShopInfo, setLoadingShopInfo] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [cart, setCart] = useState<Cart | null>(null)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay')
  const [checkoutItems, setCheckoutItems] = useState<CartItemWithShop[]>([])

  const enrichItemsWithShop = useCallback(async (items: CartItem[]): Promise<CartItemWithShop[]> => {
    const initialItems = items.map((item) => item as CartItemWithShop)
    const missingShopItems = initialItems.filter((item) => !item.shopId || !item.shopName)

    if (missingShopItems.length === 0) {
      return initialItems
    }

    setLoadingShopInfo(true)
    try {
      const uniqueProductIds = Array.from(new Set(missingShopItems.map((item) => item.productId)))
      const resolvedMap = new Map<string, { shopId?: string; shopName?: string }>()

      const results = await Promise.allSettled(
        uniqueProductIds.map(async (productId) => {
          const res = await getProductById(productId)
          return { productId, product: res.product }
        })
      )

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value.product) continue
        resolvedMap.set(result.value.productId, {
          shopId: result.value.product.shopId,
          shopName: result.value.product.shopName,
        })
      }

      return initialItems.map((item) => {
        const resolved = resolvedMap.get(item.productId)
        return {
          ...item,
          shopId: item.shopId ?? resolved?.shopId,
          shopName: item.shopName ?? resolved?.shopName ?? 'Shop không xác định',
        }
      })
    } finally {
      setLoadingShopInfo(false)
    }
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

      const enrichedItems = await enrichItemsWithShop(itemsToCheckout)
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
        return
      }

      groupMap.set(key, {
        key,
        shopId: item.shopId,
        shopName: normalizedShopName,
        items: [item],
        subtotal: item.lineTotal,
        shippingFee: SHIPPING_FEE_PER_SHOP,
        total: 0,
        itemCount: item.quantity,
      })
    })

    return Array.from(groupMap.values()).map((group) => ({
      ...group,
      total: group.subtotal + group.shippingFee,
    }))
  }, [checkoutItems])

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

  const shippingAmount = useMemo(
    () => groupedByShop.reduce((sum, group) => sum + group.shippingFee, 0),
    [groupedByShop]
  )

  const grandTotal = subtotalAmount + shippingAmount
  const totalProductCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0)

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)

  const handlePlaceOrder = async () => {
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

    setPlacingOrder(true)
    try {
      const checkoutRes = await cartService.checkout({
        cartId: cart.id,
        shippingAddressId: selectedAddressId,
      })

      if (!checkoutRes.success || !checkoutRes.data?.success) {
        toast.error(checkoutRes.message || checkoutRes.data?.message || 'Đặt hàng thất bại')
        return
      }

      const orderIds = checkoutRes.data.orderIds ?? []
      sessionStorage.removeItem(CHECKOUT_SELECTED_IDS_KEY)

      if (paymentMethod === 'vnpay' || paymentMethod === 'momo') {
        if (orderIds.length === 0) {
          toast.success('Đặt hàng thành công')
          router.push('/user/purchase')
          return
        }

        const gatewayLabel = paymentMethod === 'momo' ? 'MoMo' : 'VNPay'
        if (orderIds.length > 1) {
          toast.info(
            `Đã tạo nhiều đơn theo shop. Hệ thống sẽ thanh toán ${gatewayLabel} cho đơn đầu tiên.`
          )
        }

        const payFn =
          paymentMethod === 'momo'
            ? paymentsService.createMoMoPayment
            : paymentsService.createVNPayPayment
        const paymentRes = await payFn(orderIds[0])
        if (!paymentRes.success || !paymentRes.paymentUrl) {
          toast.error(paymentRes.message || `Không thể tạo giao dịch ${gatewayLabel}`)
          router.push('/user/purchase')
          return
        }

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
            <Link
              href="/user/profile/addresses"
              className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(236,127,19,0.08)]"
              style={{ borderColor: '#d9cec2', color: 'var(--color-primary)' }}
            >
              Thay đổi
            </Link>
          </div>
          <div className="px-5 py-4">
            {selectedAddress ? (
              <div className="grid gap-2 text-sm">
                <p className="font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  {getAddressDisplayName(selectedAddress)} {selectedAddress.phone ? `| ${selectedAddress.phone}` : ''}
                </p>
                <p className="text-muted-foreground">{formatAddress(selectedAddress)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn chưa có địa chỉ giao hàng</p>
            )}
          </div>
        </div>

        {loadingShopInfo && (
          <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: '#e5ded6' }}>
            <p className="text-xs text-muted-foreground">Đang đồng bộ thông tin shop cho sản phẩm...</p>
          </div>
        )}

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
              <div className="flex items-center gap-2">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    toast.message(`Chat với shop "${group.shopName}"`)
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[rgba(236,127,19,0.08)]"
                  style={{ borderColor: '#d9cec2', color: 'var(--color-primary)' }}
                >
                  <MessageCircle size={13} />
                  <span>Chat với người bán</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toast.message(`Trang chi tiết của shop "${group.shopName}"`)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#d9cec2', color: 'var(--color-text-secondary)' }}
                >
                  <StoreIcon size={13} />
                  <span>Xem chi tiết shop</span>
                </button>
                <div className="rounded-full bg-[rgba(236,127,19,0.1)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                  Tách đơn theo shop
                </div>
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
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl border bg-gray-50" style={{ borderColor: '#e5ded6' }}>
                        {item.productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck size={15} />
                  <span>Phương thức vận chuyển</span>
                </div>
                <span className="font-medium" style={{ color: 'var(--color-text-main)' }}>
                  Nhanh - {formatPrice(group.shippingFee)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">Tổng shop:</span>
                <span className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {formatPrice(group.total)}
                </span>
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
                    <div className="size-7 shrink-0 overflow-hidden rounded border bg-white" style={{ borderColor: '#ddd5cb' }}>
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt={line.label}
                          width={28}
                          height={28}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center">
                          <span className="material-symbols-outlined text-[14px] text-muted-foreground">image</span>
                        </div>
                      )}
                    </div>
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
                <span style={{ color: 'var(--color-text-main)' }}>{formatPrice(shippingAmount)}</span>
              </div>
            </div>

            <div className="grid gap-2 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng tạm tính</span>
                <span style={{ color: 'var(--color-text-main)' }}>{formatPrice(grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thuế</span>
                <span style={{ color: 'var(--color-text-main)' }}>0đ</span>
              </div>
            </div>

            <div className="border-t bg-white px-4 py-4" style={{ borderColor: '#e4ddd4' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-main)' }}>
                  Tổng thanh toán
                </span>
                <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {formatPrice(grandTotal)}
                </span>
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
            disabled={placingOrder || !selectedAddress}
            className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {placingOrder ? 'Đang xử lý...' : `Đặt hàng (${totalProductCount} sản phẩm)`}
          </button>
        </div>
      </div>
    </div>
  )
}
