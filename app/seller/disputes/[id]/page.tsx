"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft, IconUser, IconReceipt,
  IconMessageCircle, IconNote, IconPhoto,
  IconClock,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency } from "@/lib/formatters"
import { fetchSellerDisputeById, respondToSellerDispute, approveReturn, confirmReturnReceipt, approveRefundSeller, rejectSellerDispute } from "@/services/disputes"
import { DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeTypeLabels, DisputeType } from "@/types/dispute"
import type { SellerDispute } from "@/types/dispute"
import { OrderStatus } from "@/types/seller-dashboard"
import { EvidenceUploader } from "@/components/common/evidence-uploader"
import { EvidenceGuidelines } from "@/components/common/evidence-guidelines"
import { useAuth } from "@/contexts/auth-context"
import { HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr"

export default function SellerDisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const [dispute, setDispute] = React.useState<SellerDispute | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dlgOpen, setDlgOpen] = React.useState(false)
  const [respondText, setRespondText] = React.useState("")
  const [respondEvidenceUrls, setRespondEvidenceUrls] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState(false)
  const [rejectDlgOpen, setRejectDlgOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchSellerDisputeById(id)
      if (r.success && r.dispute) setDispute(r.dispute)
      else toast.error(r.message ?? "Không tìm thấy")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [id])

  React.useEffect(() => { load() }, [load])

  React.useEffect(() => {
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

    connection.start().catch(err => console.warn("SignalR Connection Error (Seller Dispute):", err))

    return () => {
      connection.stop()
    }
  }, [session?.access_token, id, dispute?.orderId, load])

  const finalStatuses = new Set<number>([
    DisputeStatus.Resolved,
    DisputeStatus.Rejected,
    DisputeStatus.Refunded,
    DisputeStatus.Cancelled,
  ])
  const isFinal = dispute ? finalStatuses.has(dispute.status) : false

  const openRespond = () => {
    setRespondText(dispute?.sellerResponse ?? "")
    setRespondEvidenceUrls(dispute?.sellerEvidenceUrls ?? [])
    setDlgOpen(true)
  }

  const handleRespond = async () => {
    if (!dispute || respondText.trim().length < 10) return
    setBusy(true)
    try {
      const r = await respondToSellerDispute(
        dispute.id, respondText.trim(),
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

  const handleReject = async () => {
    if (!dispute || respondText.trim().length < 10) return
    setBusy(true)
    try {
      const r = await rejectSellerDispute(
        dispute.id, respondText.trim(),
        respondEvidenceUrls.length > 0 ? respondEvidenceUrls : undefined
      )
      if (r.success) {
        toast.success("Đã từ chối khiếu nại. Admin sẽ vào phân xử.")
        setRejectDlgOpen(false)
        load()
      } else toast.error(r.message ?? "Lỗi từ chối khiếu nại")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleApproveReturn = async () => {
    if (!dispute) return
    if (!confirm("Bạn có chắc chắn muốn chấp nhận yêu cầu trả hàng này?")) return
    setBusy(true)
    try {
      const r = await approveReturn(dispute.id)
      if (r.success) {
        toast.success("Đã chấp nhận trả hàng")
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleConfirmReceipt = async () => {
    if (!dispute) return
    if (!confirm("Bạn xác nhận đã nhận được hàng trả về từ đơn vị vận chuyển? Yêu cầu sẽ được chuyển cho Admin duyệt hoàn tiền cho khách hàng.")) return
    setBusy(true)
    try {
      const r = await confirmReturnReceipt(dispute.id)
      if (r.success) {
        toast.success("Đã xác nhận nhận hàng. Vui lòng đợi Admin duyệt hoàn tiền.")
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleApproveRefund = async () => {
    if (!dispute) return
    if (!confirm("Bạn có chắc chắn đồng ý hoàn tiền cho khách? Yêu cầu sẽ được chuyển cho Admin duyệt để thực hiện hoàn tiền.")) return
    setBusy(true)
    try {
      const r = await approveRefundSeller(dispute.id)
      if (r.success) {
        toast.success("Đã gửi xác nhận đồng ý hoàn tiền. Vui lòng đợi Admin duyệt.")
        load()
      } else toast.error(r.message ?? "Lỗi hoàn tiền")
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
              <Skeleton className="h-75 rounded-lg" />
              <Skeleton className="h-75 rounded-lg" />
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
                  {dispute.affectedItems && dispute.affectedItems.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Sản phẩm khiếu nại</span>
                        <ul className="text-sm space-y-1">
                          {dispute.affectedItems.map((row) => (
                            <li key={row.orderItemId} className="flex justify-between gap-2">
                              <span>{row.productName} × {row.quantity}</span>
                              <span className="tabular-nums text-muted-foreground">{currency(row.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiêu đề</span>
                    <span className="text-sm font-medium text-right max-w-50">{dispute.title}</span>
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

                  {/* Banner chờ Admin duyệt - hiện luôn khi UnderReview bất kể canRespond */}
                  {dispute.status === DisputeStatus.UnderReview && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-center mt-2">
                      <p className="text-sm font-bold text-blue-700 flex items-center justify-center gap-2">
                        <IconClock className="size-5" />
                        Chờ Admin duyệt
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Bạn đã thực hiện xong các bước cần thiết. Vui lòng đợi Admin kiểm tra và thực hiện hoàn tiền cho khách hàng.
                      </p>
                      {dispute.adminNote && (
                        <p className="text-[11px] text-blue-500 mt-2 italic border-t border-blue-100 pt-2">
                          Ghi chú: {dispute.adminNote}
                        </p>
                      )}
                    </div>
                  )}

                  {dispute.canRespond && (
                    <>
                      <Separator />
                      <Button className="w-full gap-2" onClick={openRespond}>
                        <IconMessageCircle className="size-4" />
                        {dispute.sellerResponse ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                      </Button>

                      {!isFinal && dispute.status !== DisputeStatus.UnderReview && (
                        <>
                          <Separator className="my-2" />
                          <p className="text-xs font-semibold text-muted-foreground">Thao tác xử lý</p>
                        </> 
                      )}

                      {!isFinal && dispute.status !== DisputeStatus.UnderReview && (
                        <div className="pt-2 flex flex-col gap-2">
                          {dispute.type === DisputeType.Return ? (
                            <>
                              {(dispute.orderStatus === OrderStatus.Delivered ||
                                dispute.orderStatus === OrderStatus.Completed) && (
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                    onClick={handleApproveReturn}
                                    disabled={busy}
                                  >
                                    Chấp nhận trả hàng
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full border-red-500 text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setRespondText(dispute.sellerResponse ?? "");
                                      setRespondEvidenceUrls(dispute.sellerEvidenceUrls ?? []);
                                      setRejectDlgOpen(true);
                                    }}
                                    disabled={busy}
                                  >
                                    Từ chối khiếu nại
                                  </Button>
                                </div>
                              )}

                              {dispute.orderStatus === OrderStatus.Returning && (
                                <div className="flex flex-col gap-2">
                                  <div className="rounded-md bg-blue-50 border border-blue-100 p-3 mb-1">
                                    <p className="text-[11px] text-blue-700 flex items-center gap-1.5 font-medium">
                                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                                      Đang chờ GHN giao hàng trả về kho của bạn...
                                    </p>
                                    <p className="text-[10px] text-blue-600 mt-1">
                                      Hệ thống sẽ tự động thông báo khi hàng về đến nơi. Sau đó bạn mới có thể xác nhận nhận hàng.
                                    </p>
                                    {dispute.returnTrackingCode && (
                                      <p className="text-[10px] font-mono mt-1 text-blue-800 bg-white/50 px-1.5 py-0.5 rounded w-fit">
                                        Mã vận đơn: {dispute.returnTrackingCode}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="secondary"
                                    className="w-full opacity-50 cursor-not-allowed"
                                    disabled={true}
                                  >
                                    Xác nhận đã nhận hàng trả
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={openRespond}
                                    disabled={busy}
                                  >
                                    {dispute.sellerResponse ? "Cập nhật khiếu nại" : "Khiếu nại người mua (hàng lỗi)"}
                                  </Button>
                                </div>
                              )}

                              {dispute.orderStatus === OrderStatus.Returned && (
                                <div className="flex flex-col gap-2">
                                  <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 mb-1">
                                    <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                                      <span className="material-symbols-outlined text-sm">check_circle</span>
                                      Hàng trả đã về kho!
                                    </p>
                                    <p className="text-[10px] text-emerald-600 mt-1">
                                      Vui lòng kiểm tra kỹ sản phẩm trước khi bấm xác nhận. Sau khi xác nhận, Admin sẽ tiến hành duyệt và hoàn tiền cho khách.
                                    </p>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={handleConfirmReceipt}
                                    disabled={busy}
                                  >
                                    {busy ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={openRespond}
                                    disabled={busy}
                                  >
                                    {dispute.sellerResponse ? "Khiếu nại hàng lỗi (Admin xử lý)" : "Khiếu nại người mua (hàng lỗi)"}
                                  </Button>

                                  {dispute.returnShipmentEvidenceUrls && dispute.returnShipmentEvidenceUrls.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                        <IconPhoto className="size-3" />
                                        Bằng chứng từ Shipper:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {dispute.returnShipmentEvidenceUrls.map((url, i) => (
                                          <a 
                                            key={i} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="relative size-16 rounded-md overflow-hidden border border-emerald-200 hover:border-emerald-400 transition-colors"
                                          >
                                            <img src={url} alt={`Shipper evidence ${i+1}`} className="size-full object-cover" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="default"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleApproveRefund}
                                disabled={busy}
                              >
                                {busy ? "Đang xử lý..." : "Đồng ý hoàn tiền"}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={openRespond}
                                disabled={busy}
                              >
                                {dispute.sellerResponse ? "Cập nhật phản đối" : "Từ chối hoàn tiền (Gửi lên Admin)"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
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
            <DialogDescription asChild>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {dispute?.title} · Khách: {dispute?.customerName}
                </p>
                <p className="text-xs">
                  Nội dung gửi đi sẽ hiển thị cho bộ phận hỗ trợ khi xử lý khiếu nại; khách cũng thấy trên đơn của họ.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nội dung phản hồi *</label>
              <Textarea
                placeholder="Mô tả rõ tình trạng đơn hàng, lý do từ phía cửa hàng... (tối thiểu 10 ký tự)"
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                className="min-h-30"
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

      {/* Modal Từ chối khiếu nại */}
      <Dialog open={rejectDlgOpen} onOpenChange={setRejectDlgOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Từ chối khiếu nại này?</DialogTitle>
            <DialogDescription>
              Khi bạn từ chối, yêu cầu sẽ được chuyển cho bộ phận hỗ trợ của sàn để phân xử. 
              Vui lòng cung cấp lý do chi tiết và bằng chứng để bảo vệ quyền lợi của Shop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lý do từ chối *</label>
              <Textarea
                placeholder="Giải thích lý do bạn không đồng ý với khiếu nại của khách... (tối thiểu 10 ký tự)"
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                className="min-h-32"
                disabled={busy}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bằng chứng đối soát (Ảnh/Video)</label>
              <EvidenceGuidelines forSeller dismissible />
              <div className="mt-2">
                <EvidenceUploader
                  urls={respondEvidenceUrls}
                  onChange={setRespondEvidenceUrls}
                  disabled={busy}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDlgOpen(false)} disabled={busy}>Hủy</Button>
            <Button 
              onClick={handleReject} 
              disabled={busy || respondText.trim().length < 10}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {busy ? "Đang xử lý..." : "Xác nhận Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
