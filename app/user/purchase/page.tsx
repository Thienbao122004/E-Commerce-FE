'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ordersService, type OrderSummary } from '@/services/orders'
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'
import { cartService } from '@/services/cart'
import { paymentsService } from '@/services/payments'
import { formatDateVN as formatDate, formatPriceVND as formatPrice } from '@/lib/formatters'
import { openShopChatWithOrderProduct } from '@/lib/open-shop-chat'
import { toast } from 'sonner'
import { MessageCircle, RotateCcw, Star, Store, StoreIcon, Wallet } from 'lucide-react'
import ReviewModal from './_components/review-modal'

const STATUS_TABS = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ thanh toán', value: 0 },
  { label: 'Chờ xác nhận', value: 1 },
  { label: 'Đã xác nhận', value: 2 },
  { label: 'Đang chuẩn bị', value: 3 },
  { label: 'Đang giao hàng', value: 4 },
  { label: 'Đã giao', value: 5 },
  { label: 'Hoàn thành', value: 6 },
  { label: 'Đã hủy', value: 7 },
  { label: 'Đã hoàn tiền', value: 8 },
] as const

const STATUS_LABELS: Record<number, string> = {
  0: 'Chờ thanh toán',
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Đang chuẩn bị',
  4: 'Đang giao hàng',
  5: 'Đã giao hàng',
  6: 'Hoàn thành',
  7: 'Đã hủy',
  8: 'Đã hoàn tiền',
}

const STATUS_COLORS: Record<number, string> = {
  0: '#d97706',
  1: '#2563eb',
  2: '#1d4ed8',
  3: '#7c3aed',
  4: '#ea580c',
  5: '#16a34a',
  6: '#15803d',
  7: '#6b7280',
  8: '#dc2626',
}

const REORDERABLE_STATUSES = new Set([5, 6, 7, 8])
const PAGE_SIZE = 10

type PayChannel = 'vnpay' | 'momo'

const PAY_CHANNELS: Array<{ id: PayChannel; label: string; logo: string }> = [
  { id: 'vnpay', label: 'VNPay', logo: '/vnpay-logo.png' },
  { id: 'momo', label: 'MoMo', logo: '/momo-logo.png' },
]

export default function PurchasePage() {
  const router = useRouter()
  const { activeStatus, setActiveStatus, orders, loading, invalidateAndRefresh } = usePurchaseOrders()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null)
  const [reviewingOrder, setReviewingOrder] = useState<OrderSummary | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setCurrentPage(1)
    }, 300)
    setDebounceTimer(timer)
  }

  const filtered = debouncedSearch
    ? orders.filter(
        (o) =>
          o.shopName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          o.items.some((i) => i.productName.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : orders

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="bg-white rounded-[5px] shadow-sm border overflow-hidden" style={{ borderColor: '#e5ded6' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#e5ded6' }}>
        <span className="material-symbols-outlined text-muted-foreground text-[20px]">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên Shop hoặc tên Sản phẩm"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-main)' }}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              setDebouncedSearch('')
              setCurrentPage(1)
            }}
            className="text-muted-foreground hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <div className="flex justify-between overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value
          return (
            <button
              key={String(tab.value)}
              onClick={() => {
                setActiveStatus(tab.value)
                setSearchInput('')
                setDebouncedSearch('')
                setCurrentPage(1)
              }}
              className="flex-shrink-0 px-4 py-3 text-sm transition-colors border-b-2"
              style={{
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-t py-20 text-center" style={{ borderColor: '#e5ded6' }}>
          <span className="material-symbols-outlined text-[64px] text-muted-foreground block">
            receipt_long
          </span>
          <p className="text-muted-foreground mt-3">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 p-4">
            {paginated.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                reorderingOrderId={reorderingOrderId}
                payingOrderId={payingOrderId}
                onRefresh={invalidateAndRefresh}
                onReview={(targetOrder) => setReviewingOrder(targetOrder)}
                onReorder={async (targetOrder) => {
                  setReorderingOrderId(targetOrder.id)
                  let successCount = 0
                  let failedCount = 0

                  for (const item of targetOrder.items) {
                    try {
                      await cartService.addItem({
                        productId: item.productId,
                        quantity: item.quantity,
                      })
                      successCount += 1
                    } catch {
                      failedCount += 1
                    }
                  }

                  if (successCount > 0) {
                    toast.success(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`)
                    router.push('/user/cart')
                  }
                  if (failedCount > 0) {
                    toast.error(`${failedCount} sản phẩm mua lại thất bại`)
                  }
                  setReorderingOrderId(null)
                }}
                onPayNow={async (targetOrder, method) => {
                  setPayingOrderId(targetOrder.id)
                  const label = method === 'momo' ? 'MoMo' : 'VNPay'
                  try {
                    const payFn =
                      method === 'momo'
                        ? paymentsService.createMoMoPayment
                        : paymentsService.createVNPayPayment
                    const paymentRes = await payFn(targetOrder.id)
                    if (!paymentRes.success || !paymentRes.paymentUrl) {
                      toast.error(paymentRes.message || `Không thể tạo giao dịch ${label}`)
                      return
                    }
                    window.location.href = paymentRes.paymentUrl
                  } catch {
                    toast.error('Không thể thanh toán đơn hàng này')
                  } finally {
                    setPayingOrderId(null)
                  }
                }}
                onChatShop={(o) => openShopChatWithOrderProduct(o)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#e5ded6' }}>
              <p className="text-xs text-muted-foreground">
                Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} trong{' '}
                <span className="font-medium" style={{ color: 'var(--color-text-main)' }}>{filtered.length}</span> đơn hàng
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="size-8 flex items-center justify-center rounded border text-xs transition-colors disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d9cec2' }}
                  title="Trang đầu"
                >
                  <span className="material-symbols-outlined text-[16px]">first_page</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="size-8 flex items-center justify-center rounded border text-xs transition-colors disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d9cec2' }}
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || (p >= safePage - 1 && p <= safePage + 1))
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...')
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="size-8 flex items-center justify-center text-xs text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className="size-8 flex items-center justify-center rounded border text-xs font-medium transition-colors"
                        style={
                          safePage === item
                            ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                            : { borderColor: '#d9cec2', color: 'var(--color-text-secondary)' }
                        }
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="size-8 flex items-center justify-center rounded border text-xs transition-colors disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d9cec2' }}
                  title="Trang tiếp"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="size-8 flex items-center justify-center rounded border text-xs transition-colors disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#d9cec2' }}
                  title="Trang cuối"
                >
                  <span className="material-symbols-outlined text-[16px]">last_page</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSuccess={invalidateAndRefresh}
        />
      )}
    </div>
  )
}

function OrderCard({
  order,
  onRefresh,
  onReview,
  onReorder,
  onPayNow,
  onChatShop,
  reorderingOrderId,
  payingOrderId,
}: {
  order: OrderSummary
  onRefresh: () => void
  onReview: (order: OrderSummary) => void
  onReorder: (order: OrderSummary) => Promise<void>
  onPayNow: (order: OrderSummary, method: PayChannel) => Promise<void>
  onChatShop: (order: OrderSummary) => void
  reorderingOrderId: string | null
  payingOrderId: string | null
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [payChannel, setPayChannel] = useState<PayChannel>('vnpay')

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await ordersService.confirmOrder(order.id)
      onRefresh()
    } catch {
      // ignore
    } finally {
      setConfirming(false)
    }
  }

  const statusColor = STATUS_COLORS[order.status] ?? '#6b7280'
  const statusLabel = STATUS_LABELS[order.status] ?? order.statusName
  const canConfirm = order.status === 4
  const canPayNow = order.status === 0
  const canReorder = REORDERABLE_STATUSES.has(order.status)
  /** Đơn hoàn thành và còn ít nhất một sản phẩm chưa đánh giá (theo DB). */
  const canReview =
    order.status === 6 && order.items.some((i) => i.hasReviewedByUser !== true)
  const isReordering = reorderingOrderId === order.id
  const isPaying = payingOrderId === order.id

  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5ded6' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e5ded6' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Store size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
            {order.shopName}
          </span>
          <button
            type="button"
            onClick={() => onChatShop(order)}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors hover:bg-[rgba(236,127,19,0.08)]"
            style={{ borderColor: '#d9cec2', color: 'var(--color-primary)' }}
          >
            <MessageCircle size={12} />
            <span>Chat shop</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const slug = order.shopSlug?.trim()
              if (!slug) {
                toast.error('Không tìm thấy đường dẫn shop')
                return
              }
              router.push(`/shop/${encodeURIComponent(slug)}`)
            }}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors hover:bg-gray-50"
            style={{ borderColor: '#d9cec2', color: 'var(--color-text-secondary)' }}
          >
            <StoreIcon size={12} />
            <span>Xem chi tiết shop</span>
          </button>
        </div>
        <span className="text-sm font-semibold" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      <div className="px-4 divide-y" style={{ borderColor: '#e5ded6' }}>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="size-16 shrink-0 rounded border bg-gray-50 overflow-hidden" style={{ borderColor: '#e5ded6' }}>
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl} alt={item.productName} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-muted-foreground text-[28px]">image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
                {item.productName}
              </p>
              {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">Phân loại hàng: {item.variantName}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">x{item.quantity}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                {formatPrice(item.unitPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t flex flex-col gap-3" style={{ borderColor: '#e5ded6' }}>
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">Thành tiền:</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDate(order.createdAt)}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canPayNow && (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline">
                    Thanh toán qua
                  </span>
                  <div
                    className="inline-flex rounded-md border p-0.5 gap-0.5"
                    style={{ borderColor: '#d1c9c0', background: '#faf8f5' }}
                    role="group"
                    aria-label="Chọn cổng thanh toán"
                  >
                    {PAY_CHANNELS.map((ch) => {
                      const active = payChannel === ch.id
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setPayChannel(ch.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
                          style={{
                            background: active ? 'rgba(236,127,19,0.12)' : 'transparent',
                            color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            boxShadow: active ? 'inset 0 0 0 1px rgba(236,127,19,0.35)' : undefined,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ch.logo} alt="" className="h-4 w-auto object-contain" />
                          {ch.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onPayNow(order, payChannel)}
                  disabled={isPaying}
                  className="text-sm px-4 py-1.5 rounded text-white transition-opacity disabled:opacity-60 inline-flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Wallet size={14} />
                  <span>{isPaying ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}</span>
                </button>
              </div>
            )}
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirming}ge
                className="text-sm px-4 py-1.5 rounded text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {confirming ? 'Đang xử lý...' : 'Đã nhận được hàng'}
              </button>
            )}
            {canReview && (
              <button
                onClick={() => onReview(order)}
                className="text-sm px-4 py-1.5 rounded text-white transition-opacity inline-flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Star size={14} />
                <span>Đánh Giá</span>
              </button>
            )}
            {canReorder && (
              <button
                onClick={() => void onReorder(order)}
                disabled={isReordering}
                className="text-sm px-4 py-1.5 rounded border transition-colors hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-1.5"
                style={{ borderColor: '#d1c9c0', color: 'var(--color-text-main)' }}
              >
                <RotateCcw size={14} />
                <span>{isReordering ? 'Đang thêm...' : 'Mua lại'}</span>
              </button>
            )}
            <Link
              href={`/user/purchase/${order.id}`}
              className="text-sm px-4 py-1.5 rounded border hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#d1c9c0', color: 'var(--color-text-secondary)' }}
            >
              Xem Chi Tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
