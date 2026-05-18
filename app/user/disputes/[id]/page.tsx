"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetchMyDisputeById, cancelMyDispute, updateDisputeEvidence, sendReturnShipping } from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels, DisputeType,
} from "@/types/dispute"
import type { CustomerDispute } from "@/types/dispute"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import { EvidenceUploader } from "@/components/common/evidence-uploader"
import { HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr"

// Trạng thái customer được phép hủy (đồng bộ BE CustomerCancellableStatuses)
const CANCELLABLE_DISPUTE_STATUSES = new Set<number>([
  DisputeStatus.Pending,
  DisputeStatus.WaitingSeller,
  DisputeStatus.WaitingCustomer,
])
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-28 sm:w-36">{label}</span>
      <div className="text-sm font-medium text-right flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function CustomerDisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { session, isLoading: authLoading } = useAuth()

  const [dispute, setDispute] = useState<CustomerDispute | null>(null)
  const [loading, setLoading] = useState(true)

  // Cancel
  const [cancelOpen, setCancelOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)

  // Update evidence / respond
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [customerNote, setCustomerNote] = useState("")
  const [updatingEvidence, setUpdatingEvidence] = useState(false)

  // Return shipping
  const [trackingCode, setTrackingCode] = useState("")
  const [sendingReturn, setSendingReturn] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session) router.push("/login")
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetchMyDisputeById(id)
      if (res.success && res.dispute) {
        setDispute(res.dispute)
        // Auto-fill tracking: uu tien return tracking code da gui, fallback sang GHN goc
        const prefill = res.dispute.returnTrackingCode || res.dispute.orderTrackingCode || ""
        setTrackingCode(prefill)
      }
      else toast.error(res.message ?? "Không tìm thấy khiếu nại")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải khiếu nại")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!session?.access_token || !id) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
    if (!apiUrl) return

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/order-tracking`, {
        accessTokenFactory: () => session.access_token!,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on("DisputeUpdated", (data: { disputeId?: string }) => {
      if (data.disputeId === id) load()
    })

    connection.on("OrderStatusUpdated", (data: { orderId?: string }) => {
      if (data.orderId && dispute?.orderId === data.orderId) load()
    })

    connection.start().catch(err => console.warn("SignalR Connection Error (Customer Dispute):", err))

    return () => {
      connection.stop()
    }
  }, [session?.access_token, id, dispute?.orderId, load])

  const handleCancel = async () => {
    if (!dispute) return
    setCanceling(true)
    try {
      const res = await cancelMyDispute(dispute.id)
      if (res.success) {
        toast.success("Đã hủy khiếu nại")
        setCancelOpen(false)
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

  const handleUpdateEvidence = async () => {
    if (!session?.access_token || !dispute) return
    const isWaitingCustomer = dispute.status === DisputeStatus.WaitingCustomer
    if (isWaitingCustomer && !customerNote.trim() && evidenceUrls.length === 0) {
      toast.error("Vui lòng nhập phản hồi hoặc đính kèm bằng chứng")
      return
    }
    if (!isWaitingCustomer && evidenceUrls.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 bằng chứng")
      return
    }
    setUpdatingEvidence(true)
    try {
      const res = await updateDisputeEvidence(
        dispute.id,
        evidenceUrls,
        customerNote.trim() || undefined
      )
      if (res.success) {
        toast.success(isWaitingCustomer ? "Đã gửi phản hồi" : "Đã cập nhật bằng chứng")
        setEvidenceOpen(false)
        load()
      } else {
        toast.error(res.message ?? "Lỗi cập nhật")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setUpdatingEvidence(false)
    }
  }

  const canCancel = dispute !== null && CANCELLABLE_DISPUTE_STATUSES.has(dispute.status)
  
  const returnTerminalStatuses = new Set<number>([
    DisputeStatus.Refunded,
    DisputeStatus.Rejected,
    DisputeStatus.Cancelled,
  ])
  
  const isFinal = returnTerminalStatuses.has(dispute?.status ?? -1)
  
  const showConfirmSentSection = 
    !isFinal && 
    dispute?.type === DisputeType.Return && 
    dispute.status === DisputeStatus.WaitingCustomer;

  const returnTimelineSteps = [
    OrderStatus.Returning,
    OrderStatus.Returned,
    OrderStatus.Refunded,
  ]

  const returnStepState = (step: number) => {
    if (!dispute?.orderStatus) return "upcoming"
    
    const current = dispute.orderStatus
    
    // Nếu đơn hàng đã hoàn tiền thì tất cả các bước trả hàng đều coi là completed
    if (current === OrderStatus.Refunded) return "completed"
    
    if (current === step) return "current"

    // Định nghĩa thứ tự ưu tiên của luồng trả hàng: Returning (9) < Returned (10) < Refunded (8)
    const getPriority = (s: number) => {
      if (s === OrderStatus.Returning) return 1
      if (s === OrderStatus.Returned) return 2
      if (s === OrderStatus.Refunded) return 3
      return 0
    }

    const currentPrio = getPriority(current)
    const stepPrio = getPriority(step)

    if (currentPrio > stepPrio) return "completed"
    
    return "upcoming"
  }

  const handleSendReturn = async () => {
    if (!dispute) return
    setSendingReturn(true)
    try {
      // Gửi trackingCode hiện tại (hoặc rỗng để dung mã RTN- tự động)
      const res = await sendReturnShipping(dispute.id, trackingCode.trim() || "")
      if (res.success) {
        toast.success("Đã xác nhận gửi hàng trả")
        load()
      } else {
        toast.error(res.message ?? "Lỗi xác nhận")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setSendingReturn(false)
    }
  }

  if (authLoading || !session) return null

  return (
    <div className="w-full max-w-215 mx-auto">
      <div className="py-2 md:py-0">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-(--color-primary) transition-colors"
          >
            <span className="material-symbols-outlined text-base">home</span>
            Trang chủ
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/user/disputes" className="text-sm text-gray-500 hover:text-(--color-primary)">
            Khiếu nại của tôi
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate max-w-50">
            {loading ? "Đang tải..." : dispute?.title}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !dispute ? (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-4xl text-gray-300">report_off</span>
            <p className="text-gray-500">Không tìm thấy khiếu nại</p>
            <Link href="/user/disputes">
              <Button variant="outline">Về danh sách</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status banner */}
            <div
              className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.8)" }}
            >
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-base sm:text-lg leading-snug" style={{ color: "var(--color-text-main)" }}>
                  {dispute.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  Tại {dispute.shopName} · {formatDateTimeVN(dispute.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" className={`text-xs sm:text-sm px-3 py-1.5 self-start sm:self-auto shrink-0 ${DisputeStatusColors[dispute.status] ?? ""}`}>
                {DisputeStatusLabels[dispute.status] ?? dispute.statusName}
              </Badge>
            </div>

            {/* Main info card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--color-text-main)" }}>
                Thông tin khiếu nại
              </h2>
              <InfoRow label="Loại khiếu nại">
                <Badge variant="outline">{DisputeTypeLabels[dispute.type] ?? dispute.typeName}</Badge>
              </InfoRow>
              {dispute.affectedItems && dispute.affectedItems.length > 0 && (
                <InfoRow label="Sản phẩm khiếu nại">
                  <ul className="text-right space-y-1.5 max-w-[min(100%,320px)] ml-auto">
                    {dispute.affectedItems.map((row) => (
                      <li key={row.orderItemId} className="text-sm leading-snug">
                        <span className="font-medium text-gray-800">{row.productName}</span>
                        <span className="text-gray-500"> · SL {row.quantity}</span>
                        <span className="block text-xs text-gray-400 tabular-nums">
                          {formatPriceVND(row.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </InfoRow>
              )}
              <InfoRow label="Số tiền yêu cầu">
                <span className="text-orange-600 font-bold">{formatPriceVND(dispute.requestedAmount)}</span>
              </InfoRow>
              {dispute.approvedAmount !== null && (
                <InfoRow label="Số tiền duyệt">
                  <span className="text-green-600 font-bold">{formatPriceVND(dispute.approvedAmount)}</span>
                </InfoRow>
              )}
              <InfoRow label="Ngày tạo">{formatDateTimeVN(dispute.createdAt)}</InfoRow>
              <InfoRow label="Cập nhật lần cuối">{formatDateTimeVN(dispute.updatedAt)}</InfoRow>
            </div>

            {/* Reason & evidence */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm" style={{ color: "var(--color-text-main)" }}>
                  Lý do & Bằng chứng
                </h2>
                {dispute.canUpdateEvidence && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 gap-1 ${dispute.status === DisputeStatus.WaitingCustomer ? "border-indigo-300 text-indigo-600 hover:bg-indigo-50" : ""}`}
                    onClick={() => {
                      setEvidenceUrls([...dispute.evidenceUrls])
                      setCustomerNote(dispute.customerNote ?? "")
                      setEvidenceOpen(true)
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {dispute.status === DisputeStatus.WaitingCustomer ? "reply" : "add_photo_alternate"}
                    </span>
                    {dispute.status === DisputeStatus.WaitingCustomer ? "Gửi phản hồi" : "Cập nhật bằng chứng"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{dispute.reason}</p>

              {dispute.adminNote && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
                    Nội dung từ bộ phận hỗ trợ
                  </p>
                  <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">{dispute.adminNote}</p>
                </div>
              )}

              {dispute.status === DisputeStatus.WaitingCustomer && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
                    Cần phản hồi thêm
                  </p>
                  <p className="text-sm text-indigo-950 leading-relaxed">
                    Admin cần bạn bổ sung thông tin cho khiếu nại này. Vui lòng gửi phản hồi hoặc bằng chứng.
                  </p>
                </div>
              )}

              {dispute.status === DisputeStatus.WaitingSeller && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="material-symbols-outlined text-amber-600 text-base mt-0.5 shrink-0">storefront</span>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Đang chờ cửa hàng xử lý</p>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Shop đang được yêu cầu bổ sung thông tin. Bạn không cần làm gì thêm lúc này; nếu cần bạn trả lời, chúng tôi sẽ thông báo trên trang này.
                    </p>
                  </div>
                </div>
              )}

              {(dispute.status === DisputeStatus.Pending || dispute.status === DisputeStatus.UnderReview) && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="material-symbols-outlined text-slate-500 text-base mt-0.5 shrink-0">hourglass_empty</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Khiếu nại đang được xử lý</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Bộ phận hỗ trợ đang xem xét. Bạn sẽ thấy cập nhật tại đây khi có yêu cầu mới hoặc quyết định.
                    </p>
                  </div>
                </div>
              )}

              {dispute.customerNote && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Phản hồi bổ sung của bạn
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{dispute.customerNote}</p>
                </div>
              )}

              {dispute.evidenceUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Bằng chứng của bạn ({dispute.evidenceUrls.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dispute.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-(--color-primary) text-(--color-primary) hover:bg-[rgba(236,127,19,0.08)] transition-colors"
                      >
                        Bằng chứng {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {dispute.returnTrackingCode && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Mã vận đơn trả hàng</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                      {dispute.returnTrackingCode}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(dispute.returnTrackingCode!);
                        toast.success("Đã sao chép mã");
                      }}
                      className="size-6 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-gray-400">content_copy</span>
                    </button>
                  </div>
                </div>

                {dispute.returnShipmentEvidenceUrls && dispute.returnShipmentEvidenceUrls.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Ảnh Shipper chụp</p>
                    <div className="flex gap-1">
                      {dispute.returnShipmentEvidenceUrls.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="size-10 rounded border border-gray-200 overflow-hidden hover:border-orange-500 transition-colors"
                        >
                          <img src={url} alt={`Shipper proof ${i+1}`} className="size-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Đơn vị vận chuyển</p>
                  <p className="text-xs font-bold text-gray-700">GHN</p>
                </div>
              </div>
            )}

            {showConfirmSentSection && (
              <div className="bg-white rounded-xl border border-orange-200 p-5 space-y-3">
                <h2 className="font-semibold text-sm" style={{ color: "var(--color-text-main)" }}>
                  Xác nhận gửi hàng trả
                </h2>

                {dispute.returnTrackingCode && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-orange-600 font-medium mb-0.5">Mã vận đơn trả hàng</p>
                      <p className="text-base font-bold tracking-widest text-orange-800 font-mono">{dispute.returnTrackingCode}</p>
                    </div>
                    <span className="material-symbols-outlined text-orange-400 text-2xl">local_shipping</span>
                  </div>
                )}

                <p className="text-sm text-gray-600 leading-relaxed">
                  Shop đã tạo mã vận đơn trả hàng cho bạn. Hãy đóng gói hàng rồi bấm xác nhận gửi.
                </p>

                <Button
                  onClick={handleSendReturn}
                  disabled={sendingReturn}
                  className="w-full"
                >
                  {sendingReturn ? "Đang xử lý..." : "✓ Xác nhận đã gửi hàng"}
                </Button>
                <p className="text-xs text-gray-400">
                  Sau khi shop nhận được hàng, hệ thống sẽ tự động hoàn tiền cho bạn.
                </p>
              </div>
            )}

            {dispute.type === DisputeType.Return && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="font-semibold text-sm mb-6" style={{ color: "var(--color-text-main)" }}>
                  Timeline trả hàng
                </h2>
                <div className="flex items-center justify-between px-2">
                  {returnTimelineSteps.map((step, idx) => {
                    const state = returnStepState(step)
                    const isLast = idx === returnTimelineSteps.length - 1
                    const isDone = state === "completed"
                    const isCurrent = state === "current"
                    
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-2 group relative z-10">
                          <div className={cn(
                            "size-9 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                            isDone 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : isCurrent 
                                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200" 
                                : "bg-white border-gray-200 text-gray-400"
                          )}>
                            {isDone ? (
                              <span className="material-symbols-outlined text-sm">check</span>
                            ) : (
                              <span className="text-xs font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold tracking-tight whitespace-nowrap",
                            isDone ? "text-emerald-600" : isCurrent ? "text-orange-600" : "text-gray-400"
                          )}>
                            {idx === 0 ? "Đang trả hàng" : idx === 1 ? "Shop đã nhận" : "Hoàn tiền"}
                          </span>
                        </div>
                        
                        {!isLast && (
                          <div className="flex-1 h-0.5 mx-2 -mt-6 bg-gray-100 relative overflow-hidden">
                            <div 
                              className={cn(
                                "absolute inset-0 bg-emerald-400 transition-all duration-700 origin-left",
                                isDone ? "scale-x-100" : "scale-x-0"
                              )} 
                            />
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Trạng thái hiện tại: {dispute.orderStatus !== undefined ? (OrderStatusLabels[dispute.orderStatus] ?? "—") : "—"}
                </p>
              </div>
            )}

            {/* Seller response */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--color-text-main)" }}>
                Phản hồi từ người bán
              </h2>
              {dispute.sellerResponse ? (
                <>
                  <p className="text-sm text-gray-600 leading-relaxed">{dispute.sellerResponse}</p>
                  {dispute.sellerRespondedAt && (
                    <p className="text-xs text-gray-400 mt-2">{formatDateTimeVN(dispute.sellerRespondedAt)}</p>
                  )}
                  {dispute.sellerEvidenceUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dispute.sellerEvidenceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Bằng chứng seller {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Người bán chưa phản hồi</p>
              )}
            </div>

            {/* Resolution */}
            {dispute.resolution && (
              <div
                className="rounded-xl border p-5"
                style={{ backgroundColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.25)" }}
              >
                <h2 className="font-semibold text-sm mb-2 text-green-700">Kết luận từ Admin</h2>
                <p className="text-sm text-green-800 leading-relaxed">{dispute.resolution}</p>
              </div>
            )}

            {/* Actions */}
            {canCancel && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2"
                  onClick={() => setCancelOpen(true)}
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Hủy khiếu nại
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={(v) => { if (!v) setCancelOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy khiếu nại</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn hủy khiếu nại &ldquo;{dispute?.title}&rdquo;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={canceling}>Không</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
              {canceling ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update evidence / respond dialog */}
      <Dialog open={evidenceOpen} onOpenChange={(v) => { if (!v) setEvidenceOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dispute?.status === DisputeStatus.WaitingCustomer
                ? "Gửi phản hồi bổ sung"
                : "Cập nhật bằng chứng"}
            </DialogTitle>
            <DialogDescription>
              {dispute?.status === DisputeStatus.WaitingCustomer
                ? "Admin đang chờ thêm thông tin từ bạn. Bạn có thể viết giải thích và/hoặc đính kèm ảnh, video."
                : "Tải lên ảnh hoặc video từ thiết bị của bạn (tối đa 10 file)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dispute?.status === DisputeStatus.WaitingCustomer && (
              <div className="space-y-1.5">
                <Label>Nội dung phản hồi</Label>
                <Textarea
                  placeholder="Viết thêm giải thích, thông tin bổ sung cho admin..."
                  rows={4}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  disabled={updatingEvidence}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 text-right">{customerNote.length}/2000</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Bằng chứng đính kèm</Label>
              <EvidenceUploader
                urls={evidenceUrls}
                onChange={setEvidenceUrls}
                disabled={updatingEvidence}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceOpen(false)} disabled={updatingEvidence}>Hủy</Button>
            <Button onClick={handleUpdateEvidence} disabled={updatingEvidence}>
              {updatingEvidence
                ? "Đang gửi..."
                : dispute?.status === DisputeStatus.WaitingCustomer
                  ? "Gửi phản hồi"
                  : "Lưu bằng chứng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
