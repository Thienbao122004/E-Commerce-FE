"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft, IconUser, IconBuildingStore, IconReceipt,
  IconCheck, IconX, IconClock, IconNote, IconPhoto,
  IconMessageCircle, IconUserQuestion,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { fetchDisputeById, approveRefund, rejectDispute, requestSellerResponse, requestCustomerResponse } from "@/services/disputes"
import { DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels } from "@/types/dispute"
import type { AdminDispute } from "@/types/dispute"
import { formatDateTimeVN, formatPriceVND } from "@/lib/formatters"

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [dispute, setDispute] = React.useState<AdminDispute | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [dlgType, setDlgType] = React.useState<"approve" | "reject" | "seller" | "customer" | null>(null)
  const [resolution, setResolution] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [amount, setAmount] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchDisputeById(tk, id)
      if (r.success && r.dispute) setDispute(r.dispute)
      else toast.error(r.message ?? "Không tìm thấy")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [id])

  React.useEffect(() => { load() }, [load])

  const openDlg = (type: "approve" | "reject" | "seller" | "customer") => {
    setDlgType(type)
    setResolution("")
    setAdminNote("")
    setAmount(type === "approve" && dispute ? String(dispute.requestedAmount) : "")
  }

  const handleAction = async () => {
    if (!dispute) return
    if ((dlgType === "approve" || dlgType === "reject") && !resolution) return
    if (dlgType === "approve" && amount) {
      const amt = Number(amount)
      if (amt <= 0) { toast.error("Số tiền duyệt phải lớn hơn 0"); return }
      if (amt > dispute.requestedAmount) { toast.error("Số tiền duyệt không được vượt quá số tiền yêu cầu"); return }
    }
    setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      let r
      if (dlgType === "approve") {
        r = await approveRefund(tk, dispute.id, amount ? Number(amount) : undefined, resolution, adminNote || undefined)
      } else if (dlgType === "reject") {
        r = await rejectDispute(tk, dispute.id, resolution, adminNote || undefined)
      } else if (dlgType === "seller") {
        r = await requestSellerResponse(tk, dispute.id, adminNote || undefined)
      } else {
        r = await requestCustomerResponse(tk, dispute.id, adminNote || undefined)
      }
      if (r.success) {
        toast.success(r.message ?? "Thành công")
        setDlgType(null)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const isFinal = dispute && dispute.status >= DisputeStatus.Resolved
  const canAct = dispute && !isFinal
  const canRequestSeller = canAct && dispute.status !== DisputeStatus.WaitingSeller
  const canRequestCustomer = canAct && dispute.status !== DisputeStatus.WaitingCustomer

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><IconArrowLeft className="size-5" /></Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chi tiết tranh chấp</h1>
              <p className="text-muted-foreground text-sm font-mono">{loading ? "Đang tải..." : dispute?.id}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[280px] rounded-lg" />
              <Skeleton className="h-[280px] rounded-lg" />
            </div>
          ) : !dispute ? (
            <Card><CardContent className="flex h-48 items-center justify-center text-muted-foreground">Không tìm thấy tranh chấp.</CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Info */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconReceipt className="size-5 text-primary" />Thông tin tranh chấp</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trạng thái</span>
                      <Badge variant="secondary" className={DisputeStatusColors[dispute.status] ?? ""}>{DisputeStatusLabels[dispute.status]}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Loại</span>
                      <Badge variant="outline">{DisputeTypeLabels[dispute.type] ?? dispute.typeName}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Số tiền yêu cầu</span>
                      <span className="text-sm font-bold text-orange-600 tabular-nums">{formatPriceVND(dispute.requestedAmount)}</span>
                    </div>
                    {dispute.approvedAmount !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Số tiền duyệt</span>
                        <span className="text-sm font-bold text-green-600 tabular-nums">{formatPriceVND(dispute.approvedAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Ngày tạo</span><span className="tabular-nums">{formatDateTimeVN(dispute.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Cập nhật</span><span className="tabular-nums">{formatDateTimeVN(dispute.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer & Shop */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconUser className="size-5 text-primary" />Bên liên quan</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <IconUser className="size-4 mt-0.5 text-muted-foreground" />
                      <div><p className="text-sm font-medium">{dispute.customerName}</p><p className="text-xs text-muted-foreground">Khách hàng</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconBuildingStore className="size-4 mt-0.5 text-muted-foreground" />
                      <div><p className="text-sm font-medium">{dispute.shopName}</p><p className="text-xs text-muted-foreground">Cửa hàng</p></div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <IconNote className="size-4 mt-0.5 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground mb-1">Lý do</p><p className="text-sm">{dispute.reason}</p></div>
                    </div>
                    {dispute.customerNote && (
                      <div className="flex items-start gap-3">
                        <IconNote className="size-4 mt-0.5 text-indigo-400" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Phản hồi bổ sung từ khách hàng</p>
                          <p className="text-sm bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2 text-indigo-800">{dispute.customerNote}</p>
                        </div>
                      </div>
                    )}
                    {dispute.sellerResponse && (
                      <div className="flex items-start gap-3">
                        <IconClock className="size-4 mt-0.5 text-muted-foreground" />
                        <div><p className="text-xs text-muted-foreground mb-1">Phản hồi seller</p><p className="text-sm">{dispute.sellerResponse}</p></div>
                      </div>
                    )}
                    {dispute.resolution && (
                      <>
                        <Separator />
                        <div><p className="text-xs text-muted-foreground mb-1">Kết luận</p><p className="text-sm font-medium">{dispute.resolution}</p></div>
                      </>
                    )}
                    {dispute.adminNote && (
                      <div><p className="text-xs text-muted-foreground mb-1">Ghi chú admin</p><p className="text-sm italic">{dispute.adminNote}</p></div>
                    )}
                    {canAct && (
                      <>
                        <Separator />
                        {/* Điều phối: yêu cầu phản hồi */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                            disabled={!canRequestSeller}
                            onClick={() => openDlg("seller")}
                          >
                            <IconBuildingStore className="mr-1.5 size-4" />
                            Hỏi seller
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            disabled={!canRequestCustomer}
                            onClick={() => openDlg("customer")}
                          >
                            <IconUserQuestion className="mr-1.5 size-4" />
                            Hỏi customer
                          </Button>
                        </div>
                        {/* Quyết định cuối */}
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => openDlg("approve")}><IconCheck className="mr-1.5 size-4" />Duyệt hoàn tiền</Button>
                          <Button variant="destructive" className="flex-1" onClick={() => openDlg("reject")}><IconX className="mr-1.5 size-4" />Từ chối</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Evidence section */}
              {(dispute.evidenceUrls?.length > 0 || dispute.sellerEvidenceUrls?.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconPhoto className="size-5 text-primary" />
                      Bằng chứng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dispute.evidenceUrls?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Từ khách hàng ({dispute.evidenceUrls.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidenceUrls.map((url, i) => (
                            /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) ? (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Bằng chứng KH ${i + 1}`}
                                  className="size-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs hover:bg-muted transition-colors"
                              >
                                <IconPhoto className="size-3.5" />
                                Bằng chứng {i + 1}
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {dispute.sellerEvidenceUrls?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Từ người bán ({dispute.sellerEvidenceUrls.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.sellerEvidenceUrls.map((url, i) => (
                            /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) ? (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Bằng chứng seller ${i + 1}`}
                                  className="size-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs hover:bg-muted transition-colors"
                              >
                                <IconPhoto className="size-3.5" />
                                Bằng chứng {i + 1}
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={dlgType !== null} onOpenChange={(v) => { if (!v) setDlgType(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dlgType === "approve" ? "Duyệt hoàn tiền"
                : dlgType === "reject" ? "Từ chối tranh chấp"
                : dlgType === "seller" ? "Yêu cầu seller phản hồi"
                : "Yêu cầu customer bổ sung"}
            </DialogTitle>
            <DialogDescription>{dispute?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {dlgType === "approve" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Số tiền duyệt</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Yêu cầu: {dispute ? formatPriceVND(dispute.requestedAmount) : ""}</p>
                {amount && Number(amount) > (dispute?.requestedAmount ?? 0) && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Số tiền duyệt không được vượt quá số tiền yêu cầu</p>
                )}
              </div>
            )}
            {(dlgType === "approve" || dlgType === "reject") && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kết luận *</label>
                <Textarea placeholder="Nhập kết luận..." value={resolution} onChange={(e) => setResolution(e.target.value)} className="min-h-[60px]" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {dlgType === "seller" || dlgType === "customer" ? "Hướng dẫn / yêu cầu cụ thể" : "Ghi chú admin"}
              </label>
              <Textarea
                placeholder={
                  dlgType === "seller" ? "Ví dụ: Vui lòng cung cấp hình ảnh sản phẩm trước khi giao..."
                  : dlgType === "customer" ? "Ví dụ: Bạn vui lòng cung cấp thêm video mở hộp..."
                  : "Ghi chú nội bộ..."
                }
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgType(null)} disabled={busy}>Hủy</Button>
            <Button
              onClick={handleAction}
              disabled={busy || ((dlgType === "approve" || dlgType === "reject") && !resolution)}
              variant={dlgType === "reject" ? "destructive" : dlgType === "seller" ? "outline" : "default"}
              className={dlgType === "seller" ? "border-orange-300 text-orange-600 hover:bg-orange-50" : dlgType === "customer" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              {busy ? "Đang xử lý..."
                : dlgType === "approve" ? "Duyệt hoàn tiền"
                : dlgType === "reject" ? "Từ chối"
                : dlgType === "seller" ? "Gửi yêu cầu cho Seller"
                : "Gửi yêu cầu cho Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
