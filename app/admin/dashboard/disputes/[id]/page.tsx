"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft, IconUser, IconBuildingStore, IconReceipt,
  IconCheck, IconX, IconClock, IconNote, IconPhoto,
  IconMessageCircle, IconUserQuestion,
  IconTruckReturn, IconCash, IconAlertTriangle, IconPackageOff,
  IconSwitchHorizontal, IconStarHalf, IconQuestionMark,
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
import { fetchDisputeById, approveRefund, rejectDispute, requestSellerResponse, requestCustomerResponse } from "@/services/disputes"
import { DisputeStatus, DisputeStatusLabels, DisputeStatusColors, DisputeType, DisputeTypeLabels, disputeRefundCeiling } from "@/types/dispute"
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
    try {
      const r = await fetchDisputeById(id)
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
    let finalApproveAmount: number | undefined
    if (dlgType === "approve") {
      const d = dispute
      const ceiling = disputeRefundCeiling(d)
      const parsed = amount.trim() === "" ? undefined : Number(amount)
      let amt = parsed
      if ((amt === undefined || Number.isNaN(amt)) && d.requestedAmount > 0) {
        amt = d.requestedAmount
      }
      if (amt === undefined || Number.isNaN(amt)) {
        toast.error("Vui lòng nhập số tiền hoàn.")
        return
      }
      if (amt <= 0) { toast.error("Số tiền duyệt phải lớn hơn 0"); return }
      if (amt > ceiling) {
        toast.error(
          d.requestedAmount > 0
            ? "Số tiền duyệt không được vượt quá số tiền yêu cầu"
            : "Số tiền duyệt không được vượt quá tổng đơn hàng"
        )
        return
      }
      finalApproveAmount = amt
    }
    setBusy(true)
    try {
      let r
      if (dlgType === "approve") {
        r = await approveRefund(dispute.id, finalApproveAmount, resolution, adminNote || undefined)
      } else if (dlgType === "reject") {
        r = await rejectDispute(dispute.id, resolution, adminNote || undefined)
      } else if (dlgType === "seller") {
        r = await requestSellerResponse(dispute.id, adminNote || undefined)
      } else {
        r = await requestCustomerResponse(dispute.id, adminNote || undefined)
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconReceipt className="size-5 text-primary" />
                      Thông tin tranh chấp
                    </CardTitle>
                    {dispute.status === DisputeStatus.UnderReview && dispute.adminNote?.includes("[Hệ thống]") && (
                      <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                          </span>
                          SẴN SÀNG HOÀN TIỀN
                        </p>
                        <p className="text-[11px] text-emerald-600 mt-1">
                          Người bán đã xác nhận nhận hàng hoặc đồng ý hoàn tiền. Admin có thể thực hiện &quot;Duyệt hoàn tiền&quot; ngay.
                        </p>
                        {dispute.adminNote && (
                          <p className="text-[10px] text-emerald-500 mt-1.5 border-t border-emerald-100 pt-1.5 italic">
                            {dispute.adminNote}
                          </p>
                        )}
                      </div>
                    )}
                  </CardHeader>
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
                    {dispute.affectedItems && dispute.affectedItems.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Sản phẩm trong phạm vi khiếu nại</span>
                          <ul className="text-sm space-y-1.5">
                            {dispute.affectedItems.map((row) => (
                              <li key={row.orderItemId} className="flex justify-between gap-2 tabular-nums">
                                <span className="text-foreground font-medium">{row.productName} × {row.quantity}</span>
                                <span className="text-muted-foreground shrink-0">{formatPriceVND(row.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Số tiền yêu cầu</span>
                      <span className="text-sm font-bold text-orange-600 tabular-nums">{formatPriceVND(dispute.requestedAmount)}</span>
                    </div>
                    {dispute.orderTotal != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tổng đơn hàng</span>
                        <span className="text-sm font-medium tabular-nums">{formatPriceVND(dispute.orderTotal)}</span>
                      </div>
                    )}
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
                    {dispute.adminNote && !(dispute.status === DisputeStatus.UnderReview && dispute.adminNote.includes("[Hệ thống]")) && (
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

              {/* Type-specific guidance card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {dispute.type === DisputeType.Return && <><IconTruckReturn className="size-5 text-blue-500" />Hướng dẫn xử lý: Trả hàng</>}
                    {dispute.type === DisputeType.Refund && <><IconCash className="size-5 text-emerald-500" />Hướng dẫn xử lý: Hoàn tiền</>}
                    {dispute.type === DisputeType.Damaged && <><IconAlertTriangle className="size-5 text-orange-500" />Hướng dẫn xử lý: Hư hỏng</>}
                    {dispute.type === DisputeType.NotReceived && <><IconPackageOff className="size-5 text-red-500" />Hướng dẫn xử lý: Không nhận được</>}
                    {dispute.type === DisputeType.WrongItem && <><IconSwitchHorizontal className="size-5 text-purple-500" />Hướng dẫn xử lý: Sai hàng</>}
                    {dispute.type === DisputeType.QualityIssue && <><IconStarHalf className="size-5 text-amber-500" />Hướng dẫn xử lý: Chất lượng</>}
                    {dispute.type === DisputeType.Other && <><IconQuestionMark className="size-5 text-gray-500" />Hướng dẫn xử lý: Khác</>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dispute.type === DisputeType.Return && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Kiểm tra <span className="font-medium text-foreground">bằng chứng</span> khách hàng (ảnh/video sản phẩm lỗi)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Xác minh <span className="font-medium text-foreground">phản hồi của Seller</span> và lý do chấp nhận/từ chối</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Khi Seller đã nhận hàng trả → Xem ghi chú hệ thống → <span className="font-medium text-foreground">Duyệt hoàn tiền</span></p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.Refund && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Xác minh <span className="font-medium text-foreground">lý do hoàn tiền</span> và bằng chứng từ khách</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Kiểm tra <span className="font-medium text-foreground">phản hồi của Seller</span> (đồng ý hay phản đối)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Nhập <span className="font-medium text-foreground">số tiền duyệt</span> (có thể thấp hơn yêu cầu) → Bấm duyệt</p>
                      </div>
                      <div className="rounded-md bg-emerald-50 border border-emerald-100 p-2 mt-1">
                        <p className="text-[11px] text-emerald-600"><span className="font-semibold">Không cần trả hàng.</span> Khách giữ hàng, Admin quyết định số tiền hoàn trực tiếp.</p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.Damaged && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Kiểm tra <span className="font-medium text-foreground">ảnh/video hư hỏng</span> từ khách hàng</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Xác định <span className="font-medium text-foreground">nguyên nhân hư hỏng</span>: lỗi đóng gói, vận chuyển, hay sản xuất?</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Quyết định <span className="font-medium text-foreground">hoàn tiền một phần/toàn bộ</span> hoặc yêu cầu trả hàng</p>
                      </div>
                      <div className="rounded-md bg-orange-50 border border-orange-100 p-2 mt-1">
                        <p className="text-[11px] text-orange-600"><span className="font-semibold">Lưu ý:</span> Cần so sánh bằng chứng 2 bên. Yêu cầu Seller cung cấp ảnh đóng gói nếu cần.</p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.NotReceived && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Kiểm tra <span className="font-medium text-foreground">trạng thái vận chuyển GHN</span> của đơn hàng</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Xác minh <span className="font-medium text-foreground">bằng chứng giao hàng</span> từ shipper (ảnh, chữ ký)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Nếu đơn thất lạc → <span className="font-medium text-foreground">Hoàn tiền toàn bộ</span> cho khách</p>
                      </div>
                      <div className="rounded-md bg-red-50 border border-red-100 p-2 mt-1">
                        <p className="text-[11px] text-red-600"><span className="font-semibold">Quan trọng:</span> Liên hệ GHN xác nhận tình trạng đơn trước khi quyết định.</p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.WrongItem && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">So sánh <span className="font-medium text-foreground">sản phẩm đặt vs sản phẩm nhận</span> qua ảnh bằng chứng</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Yêu cầu Seller <span className="font-medium text-foreground">xác nhận đã gửi nhầm</span> hay khách nhầm lẫn</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Quyết định <span className="font-medium text-foreground">trả hàng + hoàn tiền</span> hoặc đổi hàng</p>
                      </div>
                      <div className="rounded-md bg-purple-50 border border-purple-100 p-2 mt-1">
                        <p className="text-[11px] text-purple-600"><span className="font-semibold">Lưu ý:</span> Khách phải trả lại hàng sai trước khi nhận hoàn tiền.</p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.QualityIssue && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Kiểm tra <span className="font-medium text-foreground">mô tả sản phẩm gốc</span> vs chất lượng thực tế từ ảnh khách</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Yêu cầu Seller <span className="font-medium text-foreground">giải trình về chất lượng</span> sản phẩm</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Quyết định <span className="font-medium text-foreground">hoàn tiền một phần</span> nếu chất lượng không đạt</p>
                      </div>
                      <div className="rounded-md bg-amber-50 border border-amber-100 p-2 mt-1">
                        <p className="text-[11px] text-amber-600"><span className="font-semibold">Lưu ý:</span> Tham khảo mô tả sản phẩm, đánh giá của khách khác để đánh giá khách quan.</p>
                      </div>
                    </div>
                  )}
                  {dispute.type === DisputeType.Other && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-muted-foreground">Đọc kỹ <span className="font-medium text-foreground">lý do khiếu nại</span> và bằng chứng đính kèm</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-muted-foreground">Liên hệ <span className="font-medium text-foreground">cả hai bên</span> để thu thập thêm thông tin</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <p className="text-xs text-muted-foreground">Đưa ra <span className="font-medium text-foreground">quyết định phù hợp</span> dựa trên bằng chứng</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

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
