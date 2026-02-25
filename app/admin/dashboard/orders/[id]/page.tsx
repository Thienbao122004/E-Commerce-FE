"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconMapPin,
  IconPhone,
  IconUser,
  IconPackage,
  IconReceipt,
  IconTruckDelivery,
  IconCheck,
  IconX,
  IconCurrencyDong,
} from "@tabler/icons-react"
import { toast } from "sonner"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { fetchOrderById, updateOrderStatus } from "@/lib/api/orders"
import {
  OrderStatus,
  OrderStatusLabels,
  OrderStatusColors,
  OrderStatusSteps,
  ValidOrderTransitions,
  getStatusStepIndex,
} from "@/lib/types/order"
import type { AdminOrderDetail } from "@/lib/types/order"

// ---------- Formatters ----------
const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

// ---------- Shopee-style Order Stepper ----------
function OrderStepper({ status }: { status: number }) {
  const stepIdx = getStatusStepIndex(status)
  const isCancelled = status === OrderStatus.Cancelled
  const isRefunded = status === OrderStatus.Refunded
  const isOffTrack = isCancelled || isRefunded

  return (
    <Card>
      <CardContent className="pt-6">
        {isOffTrack ? (
          /* Cancelled / Refunded — special banner */
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${isCancelled
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              : "bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700"
            }`}>
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isCancelled ? "bg-red-500" : "bg-gray-500"
              }`}>
              {isCancelled ? <IconX className="size-5 text-white" /> : <IconCurrencyDong className="size-5 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isCancelled ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}`}>
                {isCancelled ? "Đơn hàng đã hủy" : "Đã hoàn tiền"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCancelled ? "Đơn hàng này đã bị hủy và không thể thay đổi trạng thái." : "Đơn hàng đã được hoàn tiền cho khách hàng."}
              </p>
            </div>
          </div>
        ) : (
          /* Normal flow — horizontal stepper */
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
            {/* Progress bar fill */}
            {stepIdx >= 0 && (
              <div
                className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-500"
                style={{ width: `${(stepIdx / (OrderStatusSteps.length - 1)) * 100}%`, maxWidth: "calc(100% - 2rem)" }}
              />
            )}
            {/* Steps */}
            <div className="relative flex justify-between">
              {OrderStatusSteps.map((step, i) => {
                const isCompleted = stepIdx >= 0 && i <= stepIdx
                const isCurrent = i === stepIdx
                return (
                  <div key={step.status} className="flex flex-col items-center" style={{ width: `${100 / OrderStatusSteps.length}%` }}>
                    <div className={`
                      flex size-8 items-center justify-center rounded-full border-2 transition-all
                      ${isCompleted
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 text-gray-400"
                      }
                      ${isCurrent ? "ring-2 ring-green-200 dark:ring-green-800 ring-offset-1" : ""}
                    `}>
                      {isCompleted ? (
                        <IconCheck className="size-4" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`mt-2 text-center text-[11px] leading-tight font-medium ${isCompleted ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                      } ${isCurrent ? "font-bold" : ""}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [showDialog, setShowDialog] = React.useState(false)
  const [newStatus, setNewStatus] = React.useState("")
  const [reason, setReason] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn.")
      setLoading(false)
      return
    }
    try {
      const res = await fetchOrderById(token, id)
      if (res.success && res.order) {
        setOrder(res.order)
      } else {
        toast.error(res.message ?? "Không tìm thấy đơn hàng")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải chi tiết")
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    load()
  }, [load])

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn.")
      setActionLoading(false)
      return
    }
    try {
      const res = await updateOrderStatus(
        token,
        order.id,
        Number(newStatus),
        reason || undefined
      )
      if (res.success) {
        toast.success(res.message ?? "Cập nhật thành công")
        if (res.order) setOrder(res.order)
        setShowDialog(false)
        setNewStatus("")
        setReason("")
      } else {
        toast.error(res.message ?? "Lỗi cập nhật")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật")
    } finally {
      setActionLoading(false)
    }
  }

  const validNext = order ? (ValidOrderTransitions[order.status] ?? []) : []

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* Back + header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <IconArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Chi tiết đơn hàng
                </h1>
                <p className="text-muted-foreground text-sm font-mono">
                  {loading ? "Đang tải..." : order?.id}
                </p>
              </div>
            </div>
            {order && validNext.length > 0 && (
              <Button
                onClick={() => {
                  setShowDialog(true)
                  setNewStatus("")
                  setReason("")
                }}
              >
                Cập nhật trạng thái
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4">
              <Skeleton className="h-[80px] rounded-lg" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[250px] rounded-lg" />
                <Skeleton className="h-[250px] rounded-lg" />
              </div>
              <Skeleton className="h-[200px] rounded-lg" />
            </div>
          ) : !order ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
                Không tìm thấy đơn hàng.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Shopee-style Stepper */}
              <OrderStepper status={order.status} />

              <div className="grid gap-4 md:grid-cols-2">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconReceipt className="size-5 text-primary" />
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trạng thái</span>
                      <Badge
                        variant="secondary"
                        className={OrderStatusColors[order.status] ?? ""}
                      >
                        {OrderStatusLabels[order.status]}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tạm tính</span>
                      <span className="text-sm tabular-nums">{currency(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phí vận chuyển</span>
                      <span className="text-sm tabular-nums">{currency(order.shippingFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tổng cộng</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                        {currency(order.total)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Ngày đặt</span>
                      <span className="tabular-nums">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Cập nhật</span>
                      <span className="tabular-nums">{formatDate(order.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer & Shipping */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconTruckDelivery className="size-5 text-primary" />
                      Thông tin giao hàng
                    </CardTitle>
                    <CardDescription>Cửa hàng: {order.shopName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <IconUser className="size-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {order.shipFullName ?? order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">Người nhận</p>
                      </div>
                    </div>
                    {order.shipPhone && (
                      <div className="flex items-start gap-3">
                        <IconPhone className="size-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{order.shipPhone}</p>
                          <p className="text-xs text-muted-foreground">Số điện thoại</p>
                        </div>
                      </div>
                    )}
                    {order.shipAddress && (
                      <div className="flex items-start gap-3">
                        <IconMapPin className="size-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{order.shipAddress}</p>
                          <p className="text-xs text-muted-foreground">Địa chỉ giao hàng</p>
                        </div>
                      </div>
                    )}
                    {validNext.length > 0 && (
                      <>
                        <Separator />
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1.5">Bước tiếp theo</p>
                          <div className="flex flex-wrap gap-1.5">
                            {validNext.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => { setShowDialog(true); setNewStatus(String(s)); setReason("") }}
                              >
                                → {OrderStatusLabels[s]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconPackage className="size-5 text-primary" />
                    Sản phẩm ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {currency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {currency(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Status update dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Đơn hàng: {order?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Trạng thái hiện tại</label>
              <Badge
                variant="secondary"
                className={OrderStatusColors[order?.status ?? 0] ?? ""}
              >
                {OrderStatusLabels[order?.status ?? 0]}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Trạng thái mới</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái mới" />
                </SelectTrigger>
                <SelectContent>
                  {validNext.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {OrderStatusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lý do (tùy chọn)</label>
              <Textarea
                placeholder="Nhập lý do..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={handleStatusUpdate} disabled={actionLoading || !newStatus}>
              {actionLoading ? "Đang xử lý..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
