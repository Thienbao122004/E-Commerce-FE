'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, MessageCircle, Store, StoreIcon } from 'lucide-react'

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
import { formatDateVN as formatDate, formatPriceVND as formatPrice } from '@/lib/formatters'
import { openShopChatWithOrderProduct } from '@/lib/open-shop-chat'
import { ordersService, type OrderDetail } from '@/services/orders'
import { createDispute } from '@/services/disputes'
import { DisputeType } from '@/types/dispute'
import { EvidenceUploader } from '@/components/common/evidence-uploader'

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

const STATUS_STEPS = [0, 2, 3, 4, 5, 6] as const

const CANCELLABLE_STATUSES = new Set([0, 1, 2, 3])
// Có thể khiếu nại: Đã giao (5) hoặc Hoàn thành (6), trong vòng 7 ngày
const DISPUTE_WINDOW_DAYS = 7
const DISPUTE_ALLOWED_STATUSES = new Set([5, 6])

const DISPUTE_TYPE_OPTIONS = [
  { value: String(DisputeType.Refund), label: 'Hoàn tiền' },
  { value: String(DisputeType.Return), label: 'Trả hàng' },
  { value: String(DisputeType.Damaged), label: 'Hàng hư hỏng' },
  { value: String(DisputeType.NotReceived), label: 'Không nhận được hàng' },
  { value: String(DisputeType.WrongItem), label: 'Giao sai hàng' },
  { value: String(DisputeType.QualityIssue), label: 'Chất lượng không đảm bảo' },
  { value: String(DisputeType.Other), label: 'Khác' },
]

function StatusTimeline({ currentStatus }: { currentStatus: number }) {
  const isCancelled = currentStatus === 7
  const isRefunded = currentStatus === 8

  if (isCancelled || isRefunded) {
    const statusColor = STATUS_COLORS[currentStatus] || '#6b7280'
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
        style={{ borderColor: `${statusColor}55`, backgroundColor: `${statusColor}14`, color: statusColor }}
      >
        <div className="size-2 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-sm font-semibold">{STATUS_LABELS[currentStatus] ?? 'Đơn hàng đã kết thúc'}</span>
        <span className="text-xs opacity-80 ml-1">- Đơn hàng đã kết thúc</span>
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
  const [submittingDispute, setSubmittingDispute] = useState(false)

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
        // Chỉ update nếu trạng thái thực sự thay đổi (tránh re-render thừa)
        if (prev && prev.status === res.order!.status && prev.updatedAt === res.order!.updatedAt) {
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

  // Có thể khiếu nại: status Delivered(5)/Completed(6) và trong vòng 7 ngày kể từ updatedAt
  const canDispute = useMemo(() => {
    if (!order) return false
    if (!DISPUTE_ALLOWED_STATUSES.has(order.status)) return false
    const daysSince = (Date.now() - new Date(order.updatedAt ?? order.createdAt).getTime()) / 86400000
    return daysSince <= DISPUTE_WINDOW_DAYS
  }, [order])

  const disputeDeadline = useMemo(() => {
    if (!order) return null
    const base = new Date(order.updatedAt ?? order.createdAt)
    base.setDate(base.getDate() + DISPUTE_WINDOW_DAYS)
    return base
  }, [order])

  const canConfirm = order?.status === 5
  const isEndedOrder = order?.status === 7 || order?.status === 8
  const statusLabel = order ? (STATUS_LABELS[order.status] ?? order.statusName) : ''
  const subtotalAmount = useMemo(
    () => (order ? order.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0),
    [order],
  )
  const shippingFee = useMemo(() => {
    if (!order) return 0

    const raw = order.providerShippingFee ?? order.shippingFee
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, raw)
    }

    const estimated = order.totalAmount - subtotalAmount
    return estimated > 0 ? estimated : 0
  }, [order, subtotalAmount])

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

  const openDisputeDialog = () => {
    setDisputeForm({ type: String(DisputeType.Refund), title: '', reason: '', requestedAmount: '' })
    setDisputeEvidenceUrls([])
    setDisputeDialogOpen(true)
  }

  const handleSubmitDispute = async () => {
    if (!order) return
    if (!disputeForm.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (disputeForm.reason.trim().length < 20) { toast.error('Lý do phải có ít nhất 20 ký tự'); return }

    setSubmittingDispute(true)
    try {
      const res = await createDispute({
        orderId: order.id,
        type: Number(disputeForm.type),
        title: disputeForm.title.trim(),
        reason: disputeForm.reason.trim(),
        requestedAmount: disputeForm.requestedAmount ? Number(disputeForm.requestedAmount) : 0,
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
    if (!canCancel || canceling || confirming) return
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const submitCancelOrder = async () => {
    if (!order) return

    const reason = cancelReason.trim()
    setCanceling(true)
    try {
      const res = await ordersService.cancelOrder(order.id, reason ? { reason } : undefined)
      if (!res.success) {
        toast.error(res.message || 'Không thể hủy đơn hàng')
        return
      }
      toast.success(res.message || 'Đơn hàng đã được hủy')
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
              onClick={openDisputeDialog}
              className="cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <span className="mr-1">⚠</span>
              Khiếu nại đơn hàng
            </Button>
          )}
          {!canDispute && DISPUTE_ALLOWED_STATUSES.has(order.status) && (
            <span className="text-xs text-gray-400 self-center">Hết hạn khiếu nại</span>
          )}
        </div>
      </div>

      {isEndedOrder ? (
        <StatusTimeline currentStatus={order.status} />
      ) : (
        <div className="bg-white rounded-[5px] shadow-sm border p-4" style={{ borderColor: '#e5ded6' }}>
          <StatusTimeline currentStatus={order.status} />
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
          <p className="text-sm text-muted-foreground">{order.shipPhone || 'Chưa có số điện thoại'}</p>
          <p className="text-sm text-muted-foreground">{order.shipAddress || 'Chưa có địa chỉ giao hàng'}</p>
        </div>

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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Khiếu nại đơn hàng {order.orderCode ? `#${order.orderCode}` : ''}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 text-xs">
                {disputeDeadline && (
                  <p className="text-amber-700 font-medium">
                    ⏳ Hạn khiếu nại: {formatDate(disputeDeadline.toISOString())}
                  </p>
                )}
                <p>Mỗi đơn hàng chỉ được khiếu nại một lần. Vui lòng cung cấp bằng chứng rõ ràng.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-type">Loại khiếu nại <span className="text-red-500">*</span></Label>
              <Select value={disputeForm.type} onValueChange={(v) => setDisputeForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger id="d-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISPUTE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <EvidenceUploader
                urls={disputeEvidenceUrls}
                onChange={setDisputeEvidenceUrls}
                disabled={submittingDispute}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-amount">Số tiền yêu cầu hoàn (₫)</Label>
              <Input
                id="d-amount"
                type="number"
                min={0}
                placeholder="0"
                value={disputeForm.requestedAmount}
                onChange={(e) => setDisputeForm((f) => ({ ...f, requestedAmount: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Để trống nếu chỉ yêu cầu đổi/trả hàng</p>
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
            <DialogTitle>Hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Bạn có thể nhập lý do hủy để shop xử lý nhanh hơn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
              Lý do hủy (không bắt buộc)
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
              variant="destructive"
              onClick={() => void submitCancelOrder()}
              disabled={canceling}
              className="cursor-pointer"
            >
              {canceling ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}