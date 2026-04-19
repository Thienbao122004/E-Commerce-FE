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
import {
  fetchMyDisputes,
  cancelMyDispute,
} from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels,
} from "@/types/dispute"
import type { CustomerDispute } from "@/types/dispute"
import { formatDateVN, formatPriceVND } from "@/lib/formatters"

const PAGE_SIZE = 10
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


export default function MyDisputesPage() {
  const { session, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [disputes, setDisputes] = useState<CustomerDispute[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")

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
          <Link href="/user/disputes/new">
            <Button
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              className="gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tạo khiếu nại
            </Button>
          </Link>
        </div>

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
