'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, Lock, MessageCircle, Package, Store, StoreIcon, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDateTimeVN, formatDateVN as formatDate, formatPhoneVn, formatPriceVND as formatPrice } from '@/lib/formatters'
import { openShopChatWithOrderProduct } from '@/lib/open-shop-chat'
import { ordersService, type OrderDetail, type OrderStatusStep } from '@/services/orders'
import type { CancelOrderResponse } from '@/types/customer-order'
import { createDispute } from '@/services/disputes'
import { DisputeType } from '@/types/dispute'
import { EvidenceUploader } from '@/components/common/evidence-uploader'
import { EvidenceGuidelines } from '@/components/common/evidence-guidelines'

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

const STATUS_STEPS = [0, 1, 2, 3, 4, 5, 6] as const

// Status 0/1/2: hủy tự động ngay. Status 3 (Processing): xem thêm logic canCancelProcessing bên dưới.
const CANCELLABLE_STATUSES = new Set([0, 1, 2])
// Có thể khiếu nại: Đã giao (5) hoặc Hoàn thành (6), trong vòng 7 ngày
const DISPUTE_WINDOW_DAYS = 7
// NotReceived: Processing(3) ≥7 ngày, Shipping(4) ≥5 ngày hoặc quá ETA+1 (nếu có) — đồng bộ BE CustomerDisputeService
const NOT_RECEIVED_MIN_DAYS_PROCESSING = 7
const NOT_RECEIVED_MIN_DAYS_SHIPPING = 5
/** Khớp BE `NotReceivedDaysPastEta`: sau N ngày kể từ mốc dự kiến giao (thời điểm tuyệt đối) */
const NOT_RECEIVED_DAYS_PAST_ETA = 3
const DISPUTE_ALLOWED_STATUSES = new Set([5, 6])

function isPastEstimatedDeliveryPlusDays(estimatedIso: string | null | undefined, daysAfter: number) {
  if (!estimatedIso) return false
  const etaMs = new Date(estimatedIso).getTime()
  if (Number.isNaN(etaMs)) return false
  return Date.now() >= etaMs + daysAfter * 86400000
}

// "Không nhận được hàng" tách riêng thành nút "Báo không nhận được hàng" — không nằm trong dropdown chung
const DISPUTE_TYPE_OPTIONS = [
  { value: String(DisputeType.Refund), label: 'Hoàn tiền' },
  { value: String(DisputeType.Return), label: 'Trả hàng' },
  { value: String(DisputeType.Damaged), label: 'Hàng hư hỏng' },
  { value: String(DisputeType.WrongItem), label: 'Giao sai hàng' },
  { value: String(DisputeType.QualityIssue), label: 'Chất lượng không đảm bảo' },
  { value: String(DisputeType.Other), label: 'Khác' },
]

function StatusTimeline({
  currentStatus,
  statusTimeline,
}: {
  currentStatus: number
  statusTimeline?: OrderStatusStep[] | null
}) {
  const isCancelled = currentStatus === 7
  const isRefunded = currentStatus === 8
  const terminalAt = statusTimeline?.find((s) => s.value === currentStatus)?.reachedAt

  if (isCancelled || isRefunded) {
    const statusColor = STATUS_COLORS[currentStatus] || '#6b7280'
    return (
      <div
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:flex-wrap gap-x-2.5 gap-y-1 rounded-xl border px-4 py-3"
        style={{ borderColor: `${statusColor}55`, backgroundColor: `${statusColor}14`, color: statusColor }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-sm font-semibold">{STATUS_LABELS[currentStatus] ?? 'Đơn hàng đã kết thúc'}</span>
          <span className="text-xs opacity-80">· Đơn hàng đã kết thúc</span>
        </div>
        {terminalAt && (
          <span className="text-xs tabular-nums opacity-90 sm:ml-1">
            {formatDateTimeVN(terminalAt)}
          </span>
        )}
      </div>
    )
  }

  const mainFromApi = statusTimeline?.filter((s) => s.value >= 0 && s.value <= 6) ?? []
  if (mainFromApi.length > 0) {
    return (
      <div className="overflow-x-auto">
        <div className="flex items-center gap-0 w-full min-w-[680px] md:min-w-0">
          {mainFromApi.map((step, idx) => {
            const isLast = idx === mainFromApi.length - 1
            const isDone = step.state === 'completed'
            const isCurrent = step.state === 'current'
            const showTime = (isDone || isCurrent) && step.reachedAt
            return (
              <div key={step.value} className="contents">
                <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[72px] max-w-[100px]">
                  <div
                    className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : 'bg-muted/50 border-muted-foreground/20 text-muted-foreground/40'
                    }`}
                  >
                    {isDone ? <Check className="size-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight ${
                      isDone
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground/50'
                    }`}
                  >
                    {step.displayName || (STATUS_LABELS[step.value] ?? `Bước ${idx + 1}`)}
                  </span>
                  {showTime ? (
                    <span className="text-[9px] text-center leading-tight text-muted-foreground tabular-nums max-w-full">
                      {formatDateTimeVN(step.reachedAt!)}
                    </span>
                  ) : null}
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mb-5 mx-1 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-muted-foreground/15'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-0 w-full min-w-[680px] md:min-w-0">
        {STATUS_STEPS.map((step, idx) => {
          const isDone = currentStatus > step
          const isCurrent = currentStatus === step
          const isLast = idx === STATUS_STEPS.length - 1
          const label = STATUS_LABELS[step] ?? `Bước ${idx + 1}`

          return (
            <div key={step} className="contents">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'bg-muted/50 border-muted-foreground/20 text-muted-foreground/40'
                  }`}
                >
                  {isDone ? <Check className="size-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                </div>
                <span
                  className={`text-[10px] font-semibold text-center leading-tight whitespace-nowrap ${
                    isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-primary'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-muted-foreground/15'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PurchaseOrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const orderId = params?.id

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Dispute dialog
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [disputeForm, setDisputeForm] = useState({
    type: String(DisputeType.Refund),
    title: '',
    reason: '',
    requestedAmount: '',
  })
  const [disputeEvidenceUrls, setDisputeEvidenceUrls] = useState<string[]>([])
  /** Số lượng khiếu nại theo từng order line id (0 = không chọn). */
  const [disputeLineQty, setDisputeLineQty] = useState<Record<string, number>>({})
  const [submittingDispute, setSubmittingDispute] = useState(false)
  /** true khi dialog mở từ nút "Báo không nhận được hàng" — khóa loại = NotReceived */
  const [disputeNotReceivedOnly, setDisputeNotReceivedOnly] = useState(false)

  // Các trạng thái đơn đã kết thúc — không cần poll
  const FINAL_ORDER_STATUSES = new Set([6, 7, 8]) // Completed, Cancelled, Refunded

  const loadOrder = useCallback(async (silent = false) => {
    if (!orderId) return
    if (!silent) setLoading(true)
    try {
      const res = await ordersService.getOrderById(orderId)
      if (!res.success || !res.order) {
        if (!silent) toast.error(res.message || 'Không tìm thấy đơn hàng')
        if (!silent) setOrder(null)
        return
      }
      setOrder((prev) => {
        if (!prev) return res.order!
        if (
          prev.status === res.order!.status &&
          prev.updatedAt === res.order!.updatedAt &&
          JSON.stringify(prev.statusTimeline ?? null) === JSON.stringify(res.order!.statusTimeline ?? null)
        ) {
          return prev
        }
        return res.order!
      })
    } catch {
      if (!silent) toast.error('Không thể tải chi tiết đơn hàng')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  // Auto-poll mỗi 30s khi đơn chưa kết thúc
  useEffect(() => {
    if (!order || FINAL_ORDER_STATUSES.has(order.status)) return
    const timer = setInterval(() => void loadOrder(true), 30_000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, loadOrder])

  const canCancel = useMemo(() => {
    if (!order) return false
    return CANCELLABLE_STATUSES.has(order.status)
  }, [order])

  // Trạng thái "Đang chuẩn bị" (3): có thể gửi yêu cầu hủy nếu chưa có yêu cầu đang chờ
  const canRequestCancelProcessing = useMemo(() => {
    if (!order) return false
    return order.status === 3 && !order.cancelRequestedAt
  }, [order])

  const hasPendingCancelRequest = useMemo(() => {
    if (!order) return false
    return order.status === 3 && !!order.cancelRequestedAt
  }, [order])

  // Mốc anchor cho cửa sổ 7 ngày — đồng bộ GetReceiptAnchorUtc trong BE
  // Dùng lần đầu tiên đơn vào Delivered/Completed (từ statusTimeline), không dùng updatedAt
  const disputeAnchorDate = useMemo(() => {
    if (!order) return null
    const deliveredStep = order.statusTimeline?.find(s => s.value === 5)
    const completedStep = order.statusTimeline?.find(s => s.value === 6)
    const candidates = [deliveredStep?.reachedAt, completedStep?.reachedAt]
      .filter(Boolean)
      .map(d => new Date(d!).getTime())
    if (candidates.length > 0) return new Date(Math.min(...candidates))
    // Fallback khi không có statusTimeline (dữ liệu cũ)
    return new Date(order.updatedAt ?? order.createdAt)
  }, [order])

  // Có thể khiếu nại loại thông thường: Delivered(5)/Completed(6) trong vòng 7 ngày
  const canDispute = useMemo(() => {
    if (!order || !disputeAnchorDate) return false
    if (!DISPUTE_ALLOWED_STATUSES.has(order.status)) return false
    return (Date.now() - disputeAnchorDate.getTime()) / 86400000 <= DISPUTE_WINDOW_DAYS
  }, [order, disputeAnchorDate])

  // Có thể khiếu nại "Không nhận được hàng" — đồng bộ ValidateNotReceivedCreateRules trong BE:
  //   Processing(3) ≥7 ngày, Shipping(4) ≥5 ngày hoặc quá ETA+1, Delivered(5) trong 7 ngày kể từ anchor
  //   Completed(6) KHÔNG cho — khách đã xác nhận nhận hàng rồi
  const canDisputeNotReceived = useMemo(() => {
    if (!order) return false
    if (order.status === 3) { // Processing — cần ≥7 ngày kể từ khi vào trạng thái này
      const step = order.statusTimeline?.find(s => s.value === 3)
      const anchor = step?.reachedAt
        ? new Date(step.reachedAt).getTime()
        : new Date(order.updatedAt ?? order.createdAt).getTime()
      return (Date.now() - anchor) / 86400000 >= NOT_RECEIVED_MIN_DAYS_PROCESSING
    }
    if (order.status === 4) { // Shipping — ≥5 ngày từ khi vào Đang giao, hoặc quá 1 ngày sau mốc ETA (BE: NotReceivedShippingDelayOrEtaElapsed)
      const step = order.statusTimeline?.find(s => s.value === 4)
      const anchor = step?.reachedAt
        ? new Date(step.reachedAt).getTime()
        : new Date(order.updatedAt ?? order.createdAt).getTime()
      if ((Date.now() - anchor) / 86400000 >= NOT_RECEIVED_MIN_DAYS_SHIPPING) return true
      if (isPastEstimatedDeliveryPlusDays(order.estimatedDeliveryDate, NOT_RECEIVED_DAYS_PAST_ETA)) return true
      return false
    }
    if (order.status === 5 && disputeAnchorDate) { // Delivered — trong 7 ngày (courier đánh dấu giao nhưng khách chưa nhận)
      return (Date.now() - disputeAnchorDate.getTime()) / 86400000 <= DISPUTE_WINDOW_DAYS
    }
    return false
  }, [order, disputeAnchorDate])

  const disputeDeadline = useMemo(() => {
    if (!order || !disputeAnchorDate) return null
    if (!DISPUTE_ALLOWED_STATUSES.has(order.status)) return null
    const base = new Date(disputeAnchorDate)
    base.setDate(base.getDate() + DISPUTE_WINDOW_DAYS)
    return base
  }, [order, disputeAnchorDate])

  /** Backend: confirm only when Delivered (5) → Completed. */
  const canConfirm = order?.status === 5
  const isEndedOrder = order?.status === 7 || order?.status === 8
  const statusLabel = order ? (STATUS_LABELS[order.status] ?? order.statusName) : ''
  const subtotalAmount = useMemo(
    () => (order ? order.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0),
    [order],
  )
  const shippingFee = useMemo(() => {
    if (!order) return 0

    const raw = order.shippingFee
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, raw)
    }

    const estimated = order.totalAmount - subtotalAmount
    return estimated > 0 ? estimated : 0
  }, [order, subtotalAmount])

  /** Tổng giá trị hàng đang được chọn khiếu nại (đơn giá × SL) — trần hợp lý cho «số tiền yêu cầu hoàn». */
  const disputeSelectedGoodsValue = useMemo(() => {
    if (!order) return 0
    let sum = 0
    for (const it of order.items) {
      const q = Math.min(
        Math.max(0, Math.floor(disputeLineQty[it.id] ?? 0)),
        it.quantity,
      )
      sum += it.unitPrice * q
    }
    return sum
  }, [order, disputeLineQty])

  const handleConfirm = async () => {
    if (!order) return
    setConfirming(true)
    try {
      const res = await ordersService.confirmOrder(order.id)
      if (!res.success) {
        toast.error(res.message || 'Không thể xác nhận đơn hàng')
        return
      }
      toast.success(res.message || 'Đã xác nhận nhận hàng')
      await loadOrder()
    } catch {
      toast.error('Không thể xác nhận đơn hàng')
    } finally {
      setConfirming(false)
    }
  }

  const handleChatShop = () => {
    if (!order) return
    openShopChatWithOrderProduct(order)
  }

  const handleViewShop = () => {
    if (!order) return
    const slug = order.shopSlug?.trim()
    if (!slug) {
      toast.error('Không tìm thấy đường dẫn shop')
      return
    }
    router.push(`/shop/${encodeURIComponent(slug)}`)
  }

  const openDisputeDialog = (notReceivedOnly = false) => {
    if (!order) return
    const init: Record<string, number> = {}
    for (const it of order.items) init[it.id] = 0
    setDisputeLineQty(init)
    setDisputeForm({
      type: notReceivedOnly ? String(DisputeType.NotReceived) : String(DisputeType.Refund),
      title: '',
      reason: '',
      requestedAmount: '',
    })
    setDisputeNotReceivedOnly(notReceivedOnly)
    setDisputeEvidenceUrls([])
    setDisputeDialogOpen(true)
  }

  const handleDisputeTypeChange = (v: string) => {
    setDisputeForm((f) => {
      const next = { ...f, type: v }
      if (Number(v) === DisputeType.Refund && order && disputeSelectedGoodsValue > 0) {
        next.requestedAmount = String(Math.round(disputeSelectedGoodsValue))
      }
      return next
    })
  }

  const applyDisputeAmountFromSelection = () => {
    if (disputeSelectedGoodsValue <= 0) {
      toast.error('Chọn ít nhất một sản phẩm với số lượng khiếu nại trước.')
      return
    }
    setDisputeForm((f) => ({
      ...f,
      requestedAmount: String(Math.round(disputeSelectedGoodsValue)),
    }))
  }

  const handleSubmitDispute = async () => {
    if (!order) return
    if (!disputeForm.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (disputeForm.reason.trim().length < 20) { toast.error('Lý do phải có ít nhất 20 ký tự'); return }

    const items = order.items
      .map((it) => ({
        orderItemId: it.id,
        quantity: Math.min(Math.max(0, Math.floor(disputeLineQty[it.id] ?? 0)), it.quantity),
      }))
      .filter((x) => x.quantity > 0)

    if (items.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm và nhập số lượng khiếu nại (ô SL bên dưới).')
      return
    }

    let maxSelected = 0
    for (const line of items) {
      const it = order.items.find((i) => i.id === line.orderItemId)
      if (it) maxSelected += it.unitPrice * line.quantity
    }

    const rawAmt = disputeForm.requestedAmount.trim()
    const reqAmt = rawAmt === '' ? 0 : Number(rawAmt)
    if (Number.isNaN(reqAmt) || reqAmt < 0) {
      toast.error('Số tiền yêu cầu không hợp lệ')
      return
    }
    if (reqAmt > order.totalAmount) {
      toast.error(`Số tiền yêu cầu không được vượt quá tổng đơn (${formatPrice(order.totalAmount)})`)
      return
    }
    if (reqAmt > maxSelected + 0.01) {
      toast.error(
        `Số tiền yêu cầu không được vượt quá giá trị các sản phẩm đã chọn (${formatPrice(maxSelected)}).`,
      )
      return
    }
    if (Number(disputeForm.type) === DisputeType.Refund && reqAmt <= 0) {
      toast.error('Với loại hoàn tiền, vui lòng nhập số tiền lớn hơn 0')
      return
    }

    setSubmittingDispute(true)
    try {
      const res = await createDispute({
        orderId: order.id,
        type: Number(disputeForm.type),
        title: disputeForm.title.trim(),
        reason: disputeForm.reason.trim(),
        requestedAmount: reqAmt,
        items,
        evidenceUrls: disputeEvidenceUrls.length > 0 ? disputeEvidenceUrls : undefined,
      })
      if (res.success) {
        toast.success('Đã tạo khiếu nại thành công')
        setDisputeDialogOpen(false)
        router.push('/user/disputes')
      } else {
        toast.error(res.message ?? 'Lỗi tạo khiếu nại')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tạo khiếu nại')
    } finally {
      setSubmittingDispute(false)
    }
  }

  const openCancelDialog = () => {
    if ((!canCancel && !canRequestCancelProcessing) || canceling || confirming) return
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const submitCancelOrder = async () => {
    if (!order) return

    const reason = cancelReason.trim()
    setCanceling(true)
    try {
      const res = await ordersService.cancelOrder(order.id, reason ? { reason } : undefined) as CancelOrderResponse
      if (!res.success) {
        toast.error(res.message || 'Không thể hủy đơn hàng')
        return
      }
      if (res.cancelledImmediately === false) {
        // Yêu cầu hủy đã gửi, chờ shop duyệt
        toast.info(res.message || 'Yêu cầu hủy đã được gửi đến shop')
      } else {
        toast.success(res.message || 'Đơn hàng đã được hủy')
      }
      setCancelDialogOpen(false)
      setCancelReason('')
      await loadOrder()
    } catch {
      toast.error('Không thể hủy đơn hàng')
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[5px] shadow-sm border p-6" style={{ borderColor: '#e5ded6' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-7 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="h-24 w-full bg-gray-200 rounded" />
            <div className="h-24 w-full bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-white rounded-[5px] shadow-sm border p-6 text-center" style={{ borderColor: '#e5ded6' }}>
        <p className="text-muted-foreground">Không tìm thấy đơn hàng.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/user/purchase')}>
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[5px] shadow-sm border p-4" style={{ borderColor: '#e5ded6' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>
              Chi tiết đơn hàng {order.orderCode ? `#${order.orderCode}` : ''}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Đặt lúc {formatDate(order.createdAt)}</p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              color: STATUS_COLORS[order.status] || 'var(--color-text-main)',
              backgroundColor: `${STATUS_COLORS[order.status] || '#9ca3af'}1a`,
            }}
          >
            {statusLabel}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/user/purchase">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-1 size-4" />
              Quay lại
            </Button>
          </Link>
          {!FINAL_ORDER_STATUSES.has(order.status) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void loadOrder()}
              disabled={loading}
              className="cursor-pointer text-muted-foreground gap-1"
              title="Làm mới trạng thái đơn hàng"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleChatShop}
            className="cursor-pointer"
          >
            <MessageCircle className="mr-1 size-4" />
            Chat shop
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleViewShop}
            className="cursor-pointer"
          >
            <StoreIcon className="mr-1 size-4" />
            Xem chi tiết shop
          </Button>
          {canCancel && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={openCancelDialog}
              disabled={canceling || confirming}
              className="cursor-pointer"
            >
              {canceling ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </Button>
          )}
          {canRequestCancelProcessing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCancelDialog}
              disabled={canceling || confirming}
              className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50"
            >
              {canceling ? 'Đang gửi...' : 'Yêu cầu hủy đơn'}
            </Button>
          )}
          {hasPendingCancelRequest && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Đang chờ shop xác nhận hủy
              {order?.cancelRequestDeadline && (
                <span className="opacity-70">
                  · hạn {formatDate(order.cancelRequestDeadline)}
                </span>
              )}
            </span>
          )}
          {canConfirm && (
            <Button
              type="button"
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={confirming || canceling}
              className="cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {confirming ? 'Đang xử lý...' : 'Đã nhận được hàng'}
            </Button>
          )}
          {canDispute && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDisputeDialog(false)}
              className="cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Khiếu nại đơn hàng
            </Button>
          )}
          {!canDispute && DISPUTE_ALLOWED_STATUSES.has(order.status) && (
            <span className="text-xs text-gray-400 self-center">Hết hạn khiếu nại</span>
          )}
          {canDisputeNotReceived && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDisputeDialog(true)}
              className="cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Báo không nhận được hàng
            </Button>
          )}
        </div>
      </div>

      {isEndedOrder ? (
        <StatusTimeline currentStatus={order.status} statusTimeline={order.statusTimeline} />
      ) : (
        <div className="bg-white rounded-[5px] shadow-sm border p-4" style={{ borderColor: '#e5ded6' }}>
          <StatusTimeline currentStatus={order.status} statusTimeline={order.statusTimeline} />
        </div>
      )}

      <div className="bg-white rounded-[5px] shadow-sm border" style={{ borderColor: '#e5ded6' }}>
        <div className="p-4 border-b" style={{ borderColor: '#e5ded6' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
            Thông tin giao hàng
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
            {order.shipFullName || 'Không có thông tin người nhận'}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {order.shipPhone ? formatPhoneVn(order.shipPhone) : 'Chưa có số điện thoại'}
          </p>
          <p className="text-sm text-muted-foreground">{order.shipAddress || 'Chưa có địa chỉ giao hàng'}</p>

          {/* Ngày giao dự kiến / thực tế */}
          {(order.estimatedDeliveryDate || order.actualDeliveryDate || order.trackingCode) && (
            <div className="mt-3 rounded-lg border px-3 py-2.5 space-y-1.5 bg-blue-50/60 border-blue-100">
              {order.actualDeliveryDate ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Truck className="size-4 shrink-0" />
                  <span>
                    Đã giao lúc{' '}
                    <span className="font-semibold tabular-nums">{formatDateTimeVN(order.actualDeliveryDate)}</span>
                  </span>
                </div>
              ) : order.estimatedDeliveryDate ? (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Truck className="size-4 shrink-0" />
                  <span>
                    Dự kiến giao{' '}
                    <span className="font-semibold tabular-nums">{formatDate(order.estimatedDeliveryDate)}</span>
                  </span>
                </div>
              ) : null}
              {order.trackingCode && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="size-3.5 shrink-0" />
                  <span>
                    Mã vận đơn:{' '}
                    <span className="font-mono font-medium text-foreground">{order.trackingCode}</span>
                    {order.shippingProvider && (
                      <span className="ml-1 text-muted-foreground">({order.shippingProvider})</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {order.deliveryProofUrls && order.deliveryProofUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
                Bằng chứng giao hàng
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {order.deliveryProofUrls.map((url, i) => (
                  <div key={i} className="relative size-24 shrink-0 rounded-md overflow-hidden border snap-start cursor-pointer hover:opacity-90 transition-opacity">
                    <a href={url} target="_blank" rel="noreferrer">
                      <Image
                        src={url}
                        alt={`Bằng chứng giao hàng ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {order.cancelRequestedAt && order.status === 3 && (
            <div className="p-4 border-b" style={{ borderColor: '#e5ded6' }}>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                  Yêu cầu hủy đang chờ shop xác nhận
                </p>
                {order.cancelReason && (
                  <p className="text-xs text-amber-700">Lý do bạn cung cấp: {order.cancelReason}</p>
                )}
                <p className="text-xs text-amber-600">
                  Gửi lúc {formatDateTimeVN(order.cancelRequestedAt)}
                  {order.cancelRequestDeadline && (
                    <> · Shop phải phản hồi trước <strong>{formatDateTimeVN(order.cancelRequestDeadline)}</strong>. Nếu shop không phản hồi, đơn sẽ tự động bị hủy.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {order.cancelReason && (order.status === 7 || order.status === 8) && (
          <div className="p-4 border-b" style={{ borderColor: '#e5ded6' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#b91c1c' }}>
              Lý do hủy đơn
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.cancelReason}</p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded border p-3" style={{ borderColor: '#eadfce' }}>
              <div className="size-[72px] rounded overflow-hidden bg-gray-100 shrink-0">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.productName}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--color-text-main)' }}>
                  {item.productName}
                </p>
                {item.variantName && <p className="text-xs text-muted-foreground mt-1">Phân loại: {item.variantName}</p>}
                <p className="text-xs text-muted-foreground mt-1">Số lượng: {item.quantity}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Đơn giá</p>
                <p className="text-sm" style={{ color: 'var(--color-primary)' }}>{formatPrice(item.unitPrice)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tổng</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  {formatPrice(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start" style={{ borderColor: '#e5ded6' }}>
          <div className="inline-flex items-center gap-1.5 text-muted-foreground text-xs self-start">
            <Store size={14} />
            <span>{order.shopName}</span>
          </div>
          <div className="text-right space-y-1.5">
            <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotalAmount)}</span>
            </div>
            <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
            <p className="text-xl font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={(v) => { if (!v) setDisputeDialogOpen(false) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Khiếu nại đơn hàng {order.orderCode ? `#${order.orderCode}` : ''}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 text-xs">
                {disputeDeadline && (
                  <p className="text-amber-700 font-medium">
                     Hạn khiếu nại: {formatDate(disputeDeadline.toISOString())}
                  </p>
                )}
                <p>Mỗi đơn hàng chỉ được khiếu nại một lần. Chọn đúng sản phẩm và số lượng bị lỗi — bằng chứng rõ ràng.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {order && order.items.length > 0 && (
              <div className="space-y-1.5">
                <Label>Sản phẩm trong phạm vi khiếu nại <span className="text-red-500">*</span></Label>
                <p className="text-xs text-muted-foreground">
                  Nhập số lượng khiếu nại từng món (0 = không khiếu nại). Ví dụ chỉ tiêu đen hư: nhập 1 ở dòng đó, các món khác để 0.
                </p>
                <div className="rounded-lg border divide-y max-h-[240px] overflow-y-auto bg-muted/20">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-2.5 text-sm">
                      <div
                        className="size-12 shrink-0 rounded-md border bg-white overflow-hidden flex items-center justify-center"
                        style={{ borderColor: 'var(--border, #e5e7eb)' }}
                      >
                        {it.thumbnailUrl ? (
                          <Image
                            src={it.thumbnailUrl}
                            alt=""
                            width={48}
                            height={48}
                            className="size-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="size-6 text-muted-foreground/55" aria-hidden />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-snug line-clamp-2">{it.productName}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatPrice(it.unitPrice)} / món · tối đa {it.quantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        className="w-[4.5rem] h-9 text-center tabular-nums"
                        min={0}
                        max={it.quantity}
                        value={disputeLineQty[it.id] ?? 0}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10)
                          const v = Number.isNaN(raw)
                            ? 0
                            : Math.min(it.quantity, Math.max(0, raw))
                          setDisputeLineQty((prev) => ({ ...prev, [it.id]: v }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <span className="text-sm font-medium leading-none" id="d-type-label">Loại khiếu nại <span className="text-red-500">*</span></span>
              {disputeNotReceivedOnly ? (
                <div
                  className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-dashed border-muted-foreground/45 bg-muted/40 px-3 text-sm"
                  role="status"
                  aria-labelledby="d-type-label"
                >
                  <span className="font-medium text-foreground">Không nhận được</span>
                  <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
              ) : (
                <Select
                  value={disputeForm.type}
                  onValueChange={handleDisputeTypeChange}
                >
                  <SelectTrigger id="d-type" aria-labelledby="d-type-label"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISPUTE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {disputeNotReceivedOnly && (
                <p className="text-xs text-amber-600">
                  Bạn mở từ «Báo không nhận được hàng» trên đơn — loại này đã cố định, không đổi sang loại khác.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-title">Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                id="d-title"
                placeholder="Ví dụ: Sản phẩm bị hỏng khi nhận hàng"
                value={disputeForm.title}
                onChange={(e) => setDisputeForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-reason">Lý do chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                id="d-reason"
                placeholder="Mô tả rõ tình trạng sản phẩm, thời điểm phát hiện vấn đề... (tối thiểu 20 ký tự)"
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm((f) => ({ ...f, reason: e.target.value }))}
                className="min-h-[90px]"
                maxLength={2000}
              />
              <p className={`text-xs ${disputeForm.reason.length > 0 && disputeForm.reason.length < 20 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {disputeForm.reason.length}/2000 {disputeForm.reason.length > 0 && disputeForm.reason.length < 20 && `(còn thiếu ${20 - disputeForm.reason.length})`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>
                Bằng chứng
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">ảnh / video từ thiết bị, tối đa 10</span>
              </Label>
              <EvidenceGuidelines disputeType={Number(disputeForm.type)} />
              <EvidenceUploader
                urls={disputeEvidenceUrls}
                onChange={setDisputeEvidenceUrls}
                disabled={submittingDispute}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="d-amount">Số tiền yêu cầu hoàn (₫)</Label>
                {disputeSelectedGoodsValue > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={applyDisputeAmountFromSelection}
                  >
                    Điền theo phần hàng ({formatPrice(disputeSelectedGoodsValue)})
                  </Button>
                )}
              </div>
              <Input
                id="d-amount"
                type="number"
                min={0}
                max={order.totalAmount}
                placeholder="0"
                value={disputeForm.requestedAmount}
                onChange={(e) => setDisputeForm((f) => ({ ...f, requestedAmount: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground space-y-0.5">
                <span className="block">
                  Giá trị phần hàng đã chọn:{' '}
                  <strong className="text-foreground tabular-nums">
                    {disputeSelectedGoodsValue > 0 ? formatPrice(disputeSelectedGoodsValue) : '—'}
                  </strong>
                  {disputeSelectedGoodsValue > 0 &&
                    ' (vd. chỉ tiêu đen 1 món → tối đa yêu cầu hoàn bằng giá món đó).'}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} disabled={submittingDispute}>
              Hủy
            </Button>
            <Button
              onClick={() => void handleSubmitDispute()}
              disabled={submittingDispute}
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {submittingDispute ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{canRequestCancelProcessing ? 'Gửi yêu cầu hủy đơn' : 'Hủy đơn hàng'}</DialogTitle>
            <DialogDescription>
              {canRequestCancelProcessing
                ? 'Đơn hàng đang được chuẩn bị — yêu cầu sẽ gửi đến shop để xem xét. Bạn sẽ nhận thông báo khi shop phản hồi.'
                : 'Bạn có thể nhập lý do hủy để shop xử lý nhanh hơn.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
              Lý do hủy
            </label>
            <Textarea
              id="cancel-reason"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Tôi đổi địa chỉ nhận hàng, hoặc muốn đặt lại đơn khác..."
              maxLength={500}
              className="resize-none mt-1"
            />
            <p className="text-xs text-muted-foreground text-right">{cancelReason.length}/500</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={canceling}
              className="cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant={canRequestCancelProcessing ? 'outline' : 'destructive'}
              onClick={() => void submitCancelOrder()}
              disabled={canceling}
              className={`cursor-pointer ${canRequestCancelProcessing ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
            >
              {canceling
                ? (canRequestCancelProcessing ? 'Đang gửi...' : 'Đang hủy...')
                : (canRequestCancelProcessing ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
