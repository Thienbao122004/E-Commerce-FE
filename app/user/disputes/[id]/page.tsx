"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { fetchMyDisputeById, cancelMyDispute, updateDisputeEvidence } from "@/services/disputes"
import {
  DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels,
} from "@/types/dispute"
import type { CustomerDispute } from "@/types/dispute"
import { EvidenceUploader } from "@/components/common/evidence-uploader"

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
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <div className="text-sm font-medium text-right flex-1">{children}</div>
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

  // Update evidence
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [updatingEvidence, setUpdatingEvidence] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session) router.push("/login")
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    try {
      const res = await fetchMyDisputeById(session.access_token, id)
      if (res.success && res.dispute) setDispute(res.dispute)
      else toast.error(res.message ?? "Không tìm thấy khiếu nại")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải khiếu nại")
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => { load() }, [load])

  const handleCancel = async () => {
    if (!session?.access_token || !dispute) return
    setCanceling(true)
    try {
      const res = await cancelMyDispute(session.access_token, dispute.id)
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
    if (evidenceUrls.length === 0) { toast.error("Vui lòng thêm ít nhất 1 bằng chứng"); return }
    setUpdatingEvidence(true)
    try {
      const res = await updateDisputeEvidence(session.access_token, dispute.id, evidenceUrls)
      if (res.success) {
        toast.success("Đã cập nhật bằng chứng")
        setEvidenceOpen(false)
        load()
      } else {
        toast.error(res.message ?? "Lỗi cập nhật bằng chứng")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setUpdatingEvidence(false)
    }
  }

  const canCancel = dispute !== null && CANCELLABLE_DISPUTE_STATUSES.has(dispute.status)

  if (authLoading || !session) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-background-light)" }}>
      <header><MainStorefrontHeader /></header>

      <main className="flex-grow w-full max-w-[860px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb / back */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại
          </button>
          <span className="text-gray-300">/</span>
          <Link href="/user/disputes" className="text-sm text-gray-500 hover:text-[var(--color-primary)]">
            Khiếu nại của tôi
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate max-w-[200px]">
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
              className="rounded-xl border p-4 flex items-center justify-between gap-4"
              style={{ background: "rgba(255,255,255,0.8)" }}
            >
              <div>
                <h1 className="font-bold text-lg" style={{ color: "var(--color-text-main)" }}>
                  {dispute.title}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Tại {dispute.shopName} · {formatDateTimeVN(dispute.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" className={`text-sm px-3 py-1.5 shrink-0 ${DisputeStatusColors[dispute.status] ?? ""}`}>
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
                    className="text-xs h-8 gap-1"
                    onClick={() => {
                      setEvidenceUrls([...dispute.evidenceUrls])
                      setEvidenceOpen(true)
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                    Cập nhật bằng chứng
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{dispute.reason}</p>
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
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[rgba(236,127,19,0.08)] transition-colors"
                      >
                        Bằng chứng {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
      </main>

      <Separator className="bg-gray-200 mt-8" />
      <footer className="py-5">
        <p className="text-center text-xs text-gray-400">© 2025 EcomViet Marketplace</p>
      </footer>

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

      {/* Update evidence dialog */}
      <Dialog open={evidenceOpen} onOpenChange={(v) => { if (!v) setEvidenceOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật bằng chứng</DialogTitle>
            <DialogDescription>
              Tải lên ảnh hoặc video từ thiết bị của bạn (tối đa 10 file).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Bằng chứng đính kèm</Label>
            <EvidenceUploader
              urls={evidenceUrls}
              onChange={setEvidenceUrls}
              disabled={updatingEvidence}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceOpen(false)} disabled={updatingEvidence}>Hủy</Button>
            <Button onClick={handleUpdateEvidence} disabled={updatingEvidence}>
              {updatingEvidence ? "Đang cập nhật..." : "Lưu bằng chứng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
