'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ordersService, type OrderSummary } from '@/services/orders'
import { usePurchaseOrders } from '@/hooks/use-purchase-orders'
import { cartService } from '@/services/cart'
import { paymentsService } from '@/services/payments'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
const CHECKOUT_PENDING_PAYMENT_KEY = 'checkout:pending-payment'
const PENDING_PAYMENT_TTL_MS = 100 * 60 * 1000

type PayChannel = 'vnpay' | 'momo'

interface PendingPaymentSession {
  orderIds: string[]
  paymentMethod: PayChannel
  primaryOrderId?: string
  paymentUrl?: string
  paymentId?: string
  createdAt: string
}

function providerToPayChannel(provider?: string | null): PayChannel | null {
  if (!provider) return null
  const normalized = provider.trim().toUpperCase()
  if (normalized === 'VNPAY') return 'vnpay'
  if (normalized === 'MOMO') return 'momo'
  return null
}

function parseStatusFromQuery(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}

export default function PurchasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = parseStatusFromQuery(searchParams.get('status'))
  const highlightedOrderCode = searchParams.get('orderCode')?.trim().toUpperCase() ?? ''

  const { activeStatus, setActiveStatus, orders, loading, invalidateAndRefresh } = usePurchaseOrders(initialStatus)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null)
  const [reviewingOrder, setReviewingOrder] = useState<OrderSummary | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelTargetOrder, setCancelTargetOrder] = useState<OrderSummary | null>(null)

  const openCancelDialog = (targetOrder: OrderSummary) => {
    if (cancelingOrderId || payingOrderId) return
    setCancelTargetOrder(targetOrder)
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const submitCancelOrder = async () => {
    if (!cancelTargetOrder) return

    const reason = cancelReason.trim()
    setCancelingOrderId(cancelTargetOrder.id)
    try {
      const res = await ordersService.cancelOrder(
        cancelTargetOrder.id,
        reason ? { reason } : undefined,
      )
      if (!res.success) {
        toast.error(res.message || 'Không thể hủy đơn hàng')
        return
      }

      toast.success(res.message || 'Đơn hàng đã được hủy')
      setCancelDialogOpen(false)
      setCancelTargetOrder(null)
      setCancelReason('')
      invalidateAndRefresh()
    } catch {
      toast.error('Không thể hủy đơn hàng')
    } finally {
      setCancelingOrderId(null)
    }
  }

  useEffect(() => {
    if (initialStatus === undefined) return
    if (activeStatus !== initialStatus) {
      setActiveStatus(initialStatus)
      setCurrentPage(1)
    }
  }, [initialStatus, activeStatus, setActiveStatus])

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
                highlighted={
                  !!highlightedOrderCode &&
                  (order.orderCode?.trim().toUpperCase() ?? '') === highlightedOrderCode
                }
                reorderingOrderId={reorderingOrderId}
                payingOrderId={payingOrderId}
                cancelingOrderId={cancelingOrderId}
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
                  if (payingOrderId) return

                  if (!method) {
                    toast.error('Không xác định được cổng thanh toán của đơn này. Vui lòng tạo lại đơn hàng.')
                    return
                  }

                  setPayingOrderId(targetOrder.id)
                  const label = method === 'momo' ? 'MoMo' : 'VNPay'
                  try {
                    // Ưu tiên dùng lại URL thanh toán đã tạo trước đó để tránh tạo thêm payment record.
                    const rawSession = sessionStorage.getItem(CHECKOUT_PENDING_PAYMENT_KEY)
                    if (rawSession) {
                      const parsed = JSON.parse(rawSession) as PendingPaymentSession
                      const createdAt = Date.parse(parsed.createdAt)
                      const isFresh = Number.isFinite(createdAt) && Date.now() - createdAt <= PENDING_PAYMENT_TTL_MS
                      const sameOrder = parsed.primaryOrderId === targetOrder.id
                      const sameMethod = parsed.paymentMethod === method

                      if (isFresh && sameOrder && sameMethod && parsed.paymentUrl) {
                        window.location.href = parsed.paymentUrl
                        return
                      }
                    }

                    const payFn =
                      method === 'momo'
                        ? paymentsService.createMoMoPayment
                        : paymentsService.createVNPayPayment
                    const paymentRes = await payFn(targetOrder.id)
                    if (!paymentRes.success || !paymentRes.paymentUrl) {
                      toast.error(paymentRes.message || `Không thể tạo giao dịch ${label}`)
                      return
                    }

                    const resumableSession: PendingPaymentSession = {
                      orderIds: [targetOrder.id],
                      paymentMethod: method,
                      primaryOrderId: targetOrder.id,
                      paymentUrl: paymentRes.paymentUrl,
                      paymentId: paymentRes.paymentId,
                      createdAt: new Date().toISOString(),
                    }
                    sessionStorage.setItem(CHECKOUT_PENDING_PAYMENT_KEY, JSON.stringify(resumableSession))

                    window.location.href = paymentRes.paymentUrl
                  } catch {
                    toast.error('Không thể thanh toán đơn hàng này')
                  } finally {
                    setPayingOrderId(null)
                  }
                }}
                onCancelOrder={async (targetOrder) => {
                  openCancelDialog(targetOrder)
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

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (cancelingOrderId) return
          setCancelDialogOpen(open)
          if (!open) {
            setCancelTargetOrder(null)
            setCancelReason('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng</DialogTitle>
            <DialogDescription>
              {cancelTargetOrder?.orderCode
                ? `Đơn #${cancelTargetOrder.orderCode}`
                : 'Nhập lý do hủy (không bắt buộc).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
              Lý do hủy
            </label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ví dụ: Đổi ý, muốn cập nhật địa chỉ giao hàng..."
              className="min-h-24"
              style={{ color: 'var(--color-text-main)' }}
            />
            <p className="text-xs text-muted-foreground text-right">{cancelReason.trim().length}/500</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (cancelingOrderId) return
                setCancelDialogOpen(false)
                setCancelTargetOrder(null)
                setCancelReason('')
              }}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void submitCancelOrder()}
              disabled={!cancelTargetOrder || !!cancelingOrderId}
            >
              {cancelingOrderId ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderCard({
  order,
  highlighted,
  onRefresh,
  onReview,
  onReorder,
  onPayNow,
  onCancelOrder,
  onChatShop,
  reorderingOrderId,
  payingOrderId,
  cancelingOrderId,
}: {
  order: OrderSummary
  highlighted: boolean
  onRefresh: () => void
  onReview: (order: OrderSummary) => void
  onReorder: (order: OrderSummary) => Promise<void>
  onPayNow: (order: OrderSummary, method: PayChannel | null) => Promise<void>
  onCancelOrder: (order: OrderSummary) => Promise<void>
  onChatShop: (order: OrderSummary) => void
  reorderingOrderId: string | null
  payingOrderId: string | null
  cancelingOrderId: string | null
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const lockedPayChannel = providerToPayChannel(order.paymentProvider)

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
  const canCancel = order.status >= 0 && order.status <= 3
  const canReorder = REORDERABLE_STATUSES.has(order.status)
  /** Đơn hoàn thành và còn ít nhất một sản phẩm chưa đánh giá (theo DB). */
  const canReview =
    order.status === 6 && order.items.some((i) => i.hasReviewedByUser !== true)
  const isReordering = reorderingOrderId === order.id
  const isPaying = payingOrderId === order.id
  const isCancelling = cancelingOrderId === order.id
  const isAnyPaymentInFlight = payingOrderId !== null || cancelingOrderId !== null
  const effectivePayChannel = lockedPayChannel
  const effectivePayLabel = effectivePayChannel === 'momo' ? 'MoMo' : effectivePayChannel === 'vnpay' ? 'VNPay' : 'Không xác định'

  return (
    <div
      className="bg-white rounded-lg border overflow-hidden"
      style={{ borderColor: highlighted ? '#ec7f13' : '#e5ded6', boxShadow: highlighted ? '0 0 0 1px rgba(236,127,19,0.2)' : 'none' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e5ded6' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Store size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
            {order.shopName}
          </span>
          {order.orderCode && (
            <span className="rounded border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: '#eadfce', color: 'var(--color-text-secondary)' }}>
              #{order.orderCode}
            </span>
          )}
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
                <div className="rounded border px-2.5 py-1 text-[11px]" style={{ borderColor: '#eadfce', background: '#faf8f5' }}>
                  <span className="text-muted-foreground">Phương thức đã chọn:</span>{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{effectivePayLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void onPayNow(order, effectivePayChannel)}
                  disabled={isAnyPaymentInFlight || !effectivePayChannel}
                  className="text-sm px-4 py-1.5 rounded text-white transition-opacity disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Wallet size={14} />
                  <span>{isPaying ? 'Đang chuyển hướng...' : 'Tiếp tục thanh toán'}</span>
                </button>
              </div>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => void onCancelOrder(order)}
                disabled={isAnyPaymentInFlight || isReordering}
                className="text-sm px-4 py-1.5 rounded border transition-colors hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                style={{ borderColor: '#fecaca', color: '#b91c1c' }}
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
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
