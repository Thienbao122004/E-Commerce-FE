"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft, IconUser, IconBuildingStore, IconReceipt,
  IconMessageCircle, IconClock, IconNote, IconPhoto,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency } from "@/lib/formatters"
import { fetchSellerDisputeById, respondToSellerDispute } from "@/services/disputes"
import { DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels } from "@/types/dispute"
import type { SellerDispute } from "@/types/dispute"
import { EvidenceUploader } from "@/components/common/evidence-uploader"

export default function SellerDisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [dispute, setDispute] = React.useState<SellerDispute | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dlgOpen, setDlgOpen] = React.useState(false)
  const [respondText, setRespondText] = React.useState("")
  const [respondEvidenceUrls, setRespondEvidenceUrls] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchSellerDisputeById(tk, id)
      if (r.success && r.dispute) setDispute(r.dispute)
      else toast.error(r.message ?? "Không tìm thấy")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [id])

  React.useEffect(() => { load() }, [load])

  const openRespond = () => {
    setRespondText(dispute?.sellerResponse ?? "")
    setRespondEvidenceUrls(dispute?.sellerEvidenceUrls ?? [])
    setDlgOpen(true)
  }

  const handleRespond = async () => {
    if (!dispute || respondText.trim().length < 10) return
    setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      const r = await respondToSellerDispute(
        tk, dispute.id, respondText.trim(),
        respondEvidenceUrls.length > 0 ? respondEvidenceUrls : undefined
      )
      if (r.success) {
        toast.success("Đã gửi phản hồi thành công")
        setDlgOpen(false)
        load()
      } else toast.error(r.message ?? "Lỗi gửi phản hồi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <IconArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chi tiết khiếu nại</h1>
              <p className="text-muted-foreground text-sm font-mono">
                {loading ? "Đang tải..." : dispute?.id}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[300px] rounded-lg" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ) : !dispute ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
                Không tìm thấy khiếu nại.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Thông tin chính */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconReceipt className="size-5 text-primary" />
                    Thông tin khiếu nại
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trạng thái</span>
                    <Badge variant="secondary" className={DisputeStatusColors[dispute.status] ?? ""}>
                      {DisputeStatusLabels[dispute.status] ?? dispute.statusName}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Loại</span>
                    <Badge variant="outline">
                      {DisputeTypeLabels[dispute.type] ?? dispute.typeName}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiêu đề</span>
                    <span className="text-sm font-medium text-right max-w-[200px]">{dispute.title}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Số tiền yêu cầu</span>
                    <span className="text-sm font-bold text-orange-600 tabular-nums">
                      {currency(dispute.requestedAmount)}
                    </span>
                  </div>
                  {dispute.approvedAmount !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Số tiền duyệt</span>
                      <span className="text-sm font-bold text-green-600 tabular-nums">
                        {currency(dispute.approvedAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ngày tạo</span>
                    <span className="tabular-nums">{fmtDate(dispute.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Cập nhật</span>
                    <span className="tabular-nums">{fmtDate(dispute.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Nội dung & phản hồi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconUser className="size-5 text-primary" />
                    Nội dung & Phản hồi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Banner admin yêu cầu phản hồi */}
                  {dispute.status === DisputeStatus.WaitingSeller && (
                    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                      <IconMessageCircle className="size-4 mt-0.5 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-700">Admin đang chờ phản hồi từ bạn</p>
                        {dispute.adminNote ? (
                          <p className="text-xs text-orange-600 mt-1 leading-relaxed">Yêu cầu: {dispute.adminNote}</p>
                        ) : (
                          <p className="text-xs text-orange-500 mt-0.5">Vui lòng phản hồi khiếu nại này.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <IconUser className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{dispute.customerName}</p>
                      <p className="text-xs text-muted-foreground">Khách hàng</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <IconNote className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lý do khiếu nại</p>
                      <p className="text-sm leading-relaxed">{dispute.reason}</p>
                    </div>
                  </div>

                  {dispute.evidenceUrls.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <IconPhoto className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Bằng chứng khách hàng</p>
                          <div className="flex flex-wrap gap-2">
                            {dispute.evidenceUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer"
                                className="text-xs text-primary underline">
                                Ảnh {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {dispute.customerNote && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <IconNote className="size-4 mt-0.5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Phản hồi bổ sung từ khách hàng</p>
                          <p className="text-sm bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2 text-indigo-800 leading-relaxed">{dispute.customerNote}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {dispute.resolution && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Kết luận từ admin</p>
                        <p className="text-sm font-medium">{dispute.resolution}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-start gap-3">
                    <IconMessageCircle className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Phản hồi của bạn
                        {dispute.sellerRespondedAt && (
                          <span className="ml-2 text-[10px]">
                            ({fmtDate(dispute.sellerRespondedAt)})
                          </span>
                        )}
                      </p>
                      {dispute.sellerResponse ? (
                        <p className="text-sm leading-relaxed">{dispute.sellerResponse}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Chưa có phản hồi</p>
                      )}
                    </div>
                  </div>

                  {dispute.sellerEvidenceUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-7">
                      {dispute.sellerEvidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className="text-xs text-primary underline">
                          Bằng chứng {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {dispute.canRespond && (
                    <>
                      <Separator />
                      <Button className="w-full gap-2" onClick={openRespond}>
                        <IconMessageCircle className="size-4" />
                        {dispute.sellerResponse ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dlgOpen} onOpenChange={(v) => { if (!v) setDlgOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dispute?.sellerResponse ? "Cập nhật phản hồi" : "Gửi phản hồi khiếu nại"}
            </DialogTitle>
            <DialogDescription>
              {dispute?.title} · Khách: {dispute?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nội dung phản hồi *</label>
              <Textarea
                placeholder="Mô tả rõ tình trạng đơn hàng, lý do từ phía cửa hàng... (tối thiểu 10 ký tự)"
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                className="min-h-[120px]"
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground mt-1">{respondText.length}/2000 ký tự</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Bằng chứng đính kèm
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">ảnh / video, tối đa 10</span>
              </label>
              <EvidenceUploader
                urls={respondEvidenceUrls}
                onChange={setRespondEvidenceUrls}
                disabled={busy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgOpen(false)} disabled={busy}>Hủy</Button>
            <Button onClick={handleRespond} disabled={busy || respondText.trim().length < 10}>
              {busy ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
