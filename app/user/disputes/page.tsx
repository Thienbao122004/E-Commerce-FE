"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  fetchMyDisputes,
  createDispute,
  cancelMyDispute,
} from "@/services/disputes"
import { ordersService } from "@/services/orders"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeType, DisputeTypeLabels,
} from "@/types/dispute"
import type { CustomerDispute } from "@/types/dispute"
import { formatDateVN, formatPriceVND } from "@/lib/formatters"
import { EvidenceUploader } from "@/components/common/evidence-uploader"

const PAGE_SIZE = 10

// Trạng thái customer được phép hủy (đồng bộ BE CustomerCancellableStatuses):
//   Pending        — chưa ai xử lý
//   WaitingSeller  — đang chờ seller, customer có thể đã tự dàn xếp
//   WaitingCustomer — admin chờ phản hồi thêm từ customer
// KHÔNG cho hủy khi UnderReview (admin đang xử lý)
const CANCELLABLE_DISPUTE_STATUSES = new Set<number>([
  DisputeStatus.Pending,
  DisputeStatus.WaitingSeller,
  DisputeStatus.WaitingCustomer,
])

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: String(DisputeStatus.Pending), label: "Chờ xử lý" },
  { value: String(DisputeStatus.UnderReview), label: "Đang xem xét" },
  { value: String(DisputeStatus.WaitingSeller), label: "Chờ seller" },
  { value: String(DisputeStatus.WaitingCustomer), label: "Chờ bạn" },
  { value: String(DisputeStatus.Resolved), label: "Đã giải quyết" },
  { value: String(DisputeStatus.Rejected), label: "Từ chối" },
  { value: String(DisputeStatus.Refunded), label: "Đã hoàn tiền" },
  { value: String(DisputeStatus.Cancelled), label: "Đã hủy" },
]

const TYPE_OPTIONS = [
  { value: String(DisputeType.Refund), label: "Hoàn tiền" },
  { value: String(DisputeType.Return), label: "Trả hàng" },
  { value: String(DisputeType.Damaged), label: "Hàng hư hỏng" },
  { value: String(DisputeType.NotReceived), label: "Không nhận được" },
  { value: String(DisputeType.WrongItem), label: "Sai hàng" },
  { value: String(DisputeType.QualityIssue), label: "Chất lượng không đảm bảo" },
  { value: String(DisputeType.Other), label: "Khác" },
]

export default function MyDisputesPage() {
  const { session, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [disputes, setDisputes] = useState<CustomerDispute[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    orderId: "",
    type: String(DisputeType.Refund),
    title: "",
    reason: "",
    requestedAmount: "",
  })
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<CustomerDispute | null>(null)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session) router.push("/login?redirect=/user/disputes")
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const statusVal = statusFilter !== "all" ? Number(statusFilter) : undefined
      const res = await fetchMyDisputes(page, PAGE_SIZE, statusVal)
      if (res.success) {
        setDisputes(res.disputes)
        setTotal(res.totalCount)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách khiếu nại")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const resetForm = () => {
    setForm({ orderId: "", type: String(DisputeType.Refund), title: "", reason: "", requestedAmount: "" })
    setEvidenceUrls([])
  }

  const handleCreate = async () => {
    let actualOrderId = form.orderId.trim();
    if (!actualOrderId) { toast.error("Vui lòng nhập mã đơn hàng"); return }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(actualOrderId)) {
      setCreating(true);
      try {
        const res = await ordersService.getMyOrders(1, 100);
        const matchedItem = res.orders.find(o => o.orderCode?.trim().toUpperCase() === actualOrderId.toUpperCase());
        if (matchedItem) {
          actualOrderId = matchedItem.id;
        } else {
          toast.error("Không tìm thấy đơn hàng bạn nhập trong danh sách gần đây. Hãy vào Đơn mua -> Chi tiết đơn -> bấm Khiếu nại để thử lại.");
          setCreating(false);
          return;
        }
      } catch {
        toast.error("Lỗi khi kiểm tra mã đơn hàng.");
        setCreating(false);
        return;
      }
    }

    if (!form.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); setCreating(false); return }
    if (form.reason.trim().length < 20) { toast.error("Lý do phải có ít nhất 20 ký tự"); setCreating(false); return }

    setCreating(true)
    try {
      const detail = await ordersService.getOrderById(actualOrderId)
      if (!detail.success || !detail.order) {
        toast.error(detail.message ?? "Không tải được chi tiết đơn hàng")
        setCreating(false)
        return
      }
      const o = detail.order
      if (o.items.length === 0) {
        toast.error("Đơn không có sản phẩm")
        setCreating(false)
        return
      }
      let disputeItems: { orderItemId: string; quantity: number }[]
      if (o.items.length === 1) {
        disputeItems = [{ orderItemId: o.items[0].id, quantity: o.items[0].quantity }]
      } else {
        toast.error(
          "Đơn có nhiều sản phẩm — vui lòng vào Đơn mua → Chi tiết đơn → Khiếu nại để chọn đúng món bị lỗi.",
        )
        setCreating(false)
        return
      }

      const res = await createDispute({
        orderId: actualOrderId,
        type: Number(form.type),
        title: form.title.trim(),
        reason: form.reason.trim(),
        requestedAmount: form.requestedAmount ? Number(form.requestedAmount) : 0,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        items: disputeItems,
      })
      if (res.success) {
        toast.success("Đã tạo khiếu nại thành công")
        setCreateOpen(false)
        resetForm()
        load()
      } else {
        toast.error(res.message ?? "Lỗi tạo khiếu nại")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo khiếu nại")
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCanceling(true)
    try {
      const res = await cancelMyDispute(cancelTarget.id)
      if (res.success) {
        toast.success("Đã hủy khiếu nại")
        setCancelTarget(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi hủy khiếu nại")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setCanceling(false)
    }
  }

  const canCancel = (d: CustomerDispute) => CANCELLABLE_DISPUTE_STATUSES.has(d.status)

  if (authLoading || !session) return null

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div className="py-2 md:py-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <span className="material-symbols-outlined" style={{ color: "#ef4444", fontVariationSettings: "'FILL' 1" }}>
                report
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--color-text-main)" }}>Khiếu nại của tôi</h1>
              {!loading && (
                <p className="text-sm text-gray-400">{total} khiếu nại</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => { resetForm(); setCreateOpen(true) }}
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            className="gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tạo khiếu nại
          </Button>
        </div>

        {/* Filter — cuộn ngang trên mobile */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                statusFilter === opt.value
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(236,127,19,0.08)]"
                  : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.06)" }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: "#ef4444" }}>report_off</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">Chưa có khiếu nại nào</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter !== "all" ? "Không tìm thấy khiếu nại với bộ lọc này" : "Bạn chưa tạo khiếu nại nào"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{DisputeTypeLabels[d.type] ?? d.typeName}</Badge>
                      <Badge variant="secondary" className={`text-xs ${DisputeStatusColors[d.status] ?? ""}`}>
                        {DisputeStatusLabels[d.status] ?? d.statusName}
                      </Badge>
                    </div>
                    <Link
                      href={`/user/disputes/${d.id}`}
                      className="font-semibold text-sm hover:text-[var(--color-primary)] transition-colors line-clamp-1"
                      style={{ color: "var(--color-text-main)" }}
                    >
                      {d.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{d.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-400">
                      <span className="truncate max-w-[140px]">{d.shopName}</span>
                      <span className="font-semibold text-orange-600">{formatPriceVND(d.requestedAmount)}</span>
                      <span>{formatDateVN(d.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {canCancel(d) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8"
                        onClick={() => setCancelTarget(d)}
                      >
                        Hủy
                      </Button>
                    )}
                    <Link href={`/user/disputes/${d.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        )}
      </div>

      {/* Create Dispute Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) setCreateOpen(false) }}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Tạo khiếu nại mới</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1">
                <p>Điều kiện để khiếu nại:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-700">
                  <li>Đơn hàng phải ở trạng thái <strong>Đã giao</strong> hoặc <strong>Hoàn thành</strong></li>
                  <li>Trong vòng <strong>7 ngày</strong> kể từ khi đơn được giao/hoàn thành</li>
                  <li>Mỗi đơn hàng chỉ được khiếu nại <strong>một lần</strong></li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orderId">Mã đơn hàng (ID) <span className="text-red-500">*</span></Label>
              <Input
                id="orderId"
                placeholder="Ví dụ: 3767D68F260418"
                value={form.orderId}
                onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                Vào{" "}
                <Link href="/user/purchase" className="text-[var(--color-primary)] underline" target="_blank">
                  Đơn mua của tôi
                </Link>
                {" "}→ mở chi tiết đơn → nhấn nút &ldquo;Khiếu nại&rdquo; để tự điền mã.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Loại khiếu nại <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="Ví dụ: Sản phẩm bị hỏng khi nhận hàng"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Lý do chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Mô tả rõ ràng vấn đề bạn gặp phải, tình trạng sản phẩm, thời điểm phát hiện... (tối thiểu 20 ký tự)"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="min-h-[100px]"
                maxLength={2000}
              />
              <p className={`text-xs ${form.reason.length < 20 && form.reason.length > 0 ? "text-red-400" : "text-gray-400"}`}>
                {form.reason.length}/2000 ký tự {form.reason.length > 0 && form.reason.length < 20 && `(còn thiếu ${20 - form.reason.length})`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>
                Bằng chứng
                <span className="ml-1.5 text-xs text-gray-400 font-normal">ảnh / video từ thiết bị, tối đa 10</span>
              </Label>
              <EvidenceUploader
                urls={evidenceUrls}
                onChange={setEvidenceUrls}
                disabled={creating}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Số tiền yêu cầu hoàn (₫)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                placeholder="0"
                value={form.requestedAmount}
                onChange={(e) => setForm((f) => ({ ...f, requestedAmount: e.target.value }))}
              />
              <p className="text-xs text-gray-400">Để trống hoặc nhập 0 nếu chỉ yêu cầu đổi/trả hàng</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Hủy</Button>
            <Button onClick={handleCreate} disabled={creating}
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
              {creating ? "Đang tạo..." : "Tạo khiếu nại"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelTarget !== null} onOpenChange={(v) => { if (!v) setCancelTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy khiếu nại</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn hủy khiếu nại &ldquo;{cancelTarget?.title}&rdquo;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={canceling}>Không</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
              {canceling ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
