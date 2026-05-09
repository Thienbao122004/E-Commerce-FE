"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconRefresh,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCalendar,
  IconPackage,
  IconReceipt2,
  IconCircleCheck,
  IconClock,
  IconTruck,
  IconX,
  IconCheck,
  IconHash,
  IconShoppingBag,
  IconBarcode,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  fetchMyOrderById,
  updateMyOrderStatus,
  approveCancelRequest,
  rejectCancelRequest,
} from "@/services/seller-dashboard"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import type { OrderStatusStep } from "@/types/customer-order"
import type { SellerOrderDetail } from "@/types/seller-dashboard"
import { validTransitions } from "./order-status-dialog"
import {
  formatDateTimeVN as fmtDate,
  formatPhoneVn,
  formatPriceVND as currency,
  isVietnamPhoneLocal,
  normalizeVietnamPhone,
} from "@/lib/formatters"
import { estimatedNetAfterPlatformFeeVnd, platformFeeVndFromGross } from "@/lib/seller-platform-fee"
import { SetHeaderActions } from "@/hooks/use-header-actions"

// ── Status config ──
type StatusCfg = {
  label: string
  dotCls: string
  badgeCls: string
  icon: React.ReactNode
}

const statusConfig: Record<number, StatusCfg> = {
  [OrderStatus.PendingPayment]: {
    label: "Chờ thanh toán",
    dotCls: "bg-amber-500",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: <IconClock className="size-4" />,
  },
  [OrderStatus.PendingConfirmation]: {
    label: "Chờ xác nhận",
    dotCls: "bg-sky-500",
    badgeCls: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    icon: <IconClock className="size-4" />,
  },
  [OrderStatus.Confirmed]: {
    label: "Đã xác nhận",
    dotCls: "bg-blue-500",
    badgeCls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: <IconCircleCheck className="size-4" />,
  },
  [OrderStatus.Processing]: {
    label: "Đang chuẩn bị",
    dotCls: "bg-violet-500",
    badgeCls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    icon: <IconPackage className="size-4" />,
  },
  [OrderStatus.Shipping]: {
    label: "Đang giao hàng",
    dotCls: "bg-cyan-500",
    badgeCls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    icon: <IconTruck className="size-4" />,
  },
  [OrderStatus.Delivered]: {
    label: "Đã giao hàng",
    dotCls: "bg-emerald-500",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: <IconCheck className="size-4" />,
  },
  [OrderStatus.Completed]: {
    label: "Hoàn thành",
    dotCls: "bg-green-500",
    badgeCls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    icon: <IconCircleCheck className="size-4" />,
  },
  [OrderStatus.Cancelled]: {
    label: "Đã hủy",
    dotCls: "bg-red-500",
    badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: <IconX className="size-4" />,
  },
  [OrderStatus.Refunded]: {
    label: "Đã hoàn tiền",
    dotCls: "bg-zinc-500",
    badgeCls: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
    icon: <IconPackage className="size-4" />,
  },
}

const STATUS_STEPS = [
  OrderStatus.PendingConfirmation,
  OrderStatus.Confirmed,
  OrderStatus.Processing,
  OrderStatus.Shipping,
  OrderStatus.Delivered,
  OrderStatus.Completed,
]

function StatusTimeline({
  currentStatus,
  cancelReason,
  statusTimeline,
}: {
  currentStatus: number
  cancelReason?: string | null
  statusTimeline?: OrderStatusStep[] | null
}) {
  const isCancelled = currentStatus === OrderStatus.Cancelled
  const isRefunded = currentStatus === OrderStatus.Refunded
  const terminalAt = statusTimeline?.find((s) => s.value === currentStatus)?.reachedAt

  if (isCancelled || isRefunded) {
    const cfg = statusConfig[currentStatus]
    const normalizedCancelReason = cancelReason?.trim()
    return (
      <div className={`flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:flex-wrap gap-x-2.5 px-4 py-3 rounded-xl border ${cfg.badgeCls}`}>
        <div className="flex items-center flex-wrap gap-2.5 min-w-0">
          <div className={`size-2 shrink-0 rounded-full ${cfg.dotCls}`} />
          <span className="text-sm font-semibold">{cfg.label}</span>
          <span className="text-xs opacity-70">— Đơn hàng đã kết thúc</span>
          {terminalAt && <span className="text-xs tabular-nums opacity-90">{fmtDate(terminalAt)}</span>}
          {isCancelled && (
            <span className="text-xs opacity-80 break-words w-full sm:w-auto">
              — Lý do: {normalizedCancelReason || "Không có lý do hủy được cung cấp."}
            </span>
          )}
        </div>
      </div>
    )
  }

  const mainFromApi = statusTimeline?.filter((s) => s.value >= 0 && s.value <= 6) ?? []
  if (mainFromApi.length > 0) {
    return (
      <div className="flex items-center gap-0 overflow-x-auto min-w-0">
        {mainFromApi.map((step, idx) => {
          const cfg = statusConfig[step.value] ?? {
            label: step.displayName,
            dotCls: "bg-zinc-500",
            badgeCls: "",
            icon: <IconPackage className="size-4" />,
          }
          const isLast = idx === mainFromApi.length - 1
          const isDone = step.state === "completed"
          const isCurrent = step.state === "current"
          const showTime = (isDone || isCurrent) && step.reachedAt
          return (
            <React.Fragment key={step.value}>
              <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[72px] max-w-[100px]">
                <div
                  className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                >
                  {isDone ? <IconCheck className="size-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                </div>
                <span
                  className={`text-[10px] font-semibold text-center leading-tight ${
                    isDone ? "text-emerald-600 dark:text-emerald-400" : isCurrent ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {step.displayName || cfg.label}
                </span>
                {showTime ? (
                  <span className="text-[9px] text-center leading-tight text-muted-foreground tabular-nums max-w-full">
                    {fmtDate(step.reachedAt!)}
                  </span>
                ) : null}
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mb-5 mx-1 rounded-full min-w-[8px] ${isDone ? "bg-emerald-400" : "bg-muted-foreground/15"}`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const cfg = statusConfig[step]
        const isDone = currentStatus > step
        const isCurrent = currentStatus === step
        const isLast = idx === STATUS_STEPS.length - 1

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
                isDone
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : isCurrent
                    ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/40"
              }`}>
                {isDone ? <IconCheck className="size-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight whitespace-nowrap ${
                isDone ? "text-emerald-600 dark:text-emerald-400" : isCurrent ? "text-primary" : "text-muted-foreground/50"
              }`}>
                {cfg.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full ${isDone ? "bg-emerald-400" : "bg-muted-foreground/15"}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-14 rounded" />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[280px] rounded" />
          <Skeleton className="h-[120px] rounded" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[160px] rounded" />
          <Skeleton className="h-[140px] rounded" />
        </div>
      </div>
    </div>
  )
}

type Props = { orderId: string }

export function OrderDetailView({ orderId }: Props) {
  const router = useRouter()

  const [order, setOrder] = React.useState<SellerOrderDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [updating, setUpdating] = React.useState(false)
  const [showStatusDialog, setShowStatusDialog] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState<number | null>(null)
  const [note, setNote] = React.useState("")
  const [approvingCancel, setApprovingCancel] = React.useState(false)
  const [rejectingCancel, setRejectingCancel] = React.useState(false)
  const [rejectNote, setRejectNote] = React.useState("")
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyOrderById(orderId)
      if (res.success && res.data) {
        setOrder(res.data)
      } else {
        toast.error(res.message ?? "Không tìm thấy đơn hàng")
        router.push("/seller/orders")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải đơn hàng")
      router.push("/seller/orders")
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  React.useEffect(() => {
    load()
  }, [load])

  const transitions = order ? (validTransitions[order.status] ?? []) : []
  const canUpdate = transitions.length > 0

  const handleOpenStatusDialog = (nextStatus?: number) => {
    setSelectedStatus(nextStatus ?? transitions[0] ?? null)
    setNote("")
    setShowStatusDialog(true)
  }

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === null) return
    setUpdating(true)
    try {
      let trackingCodeToSave: string | undefined = undefined
      const deliveryPhone = order.shipPhone ?? order.customerPhone

      if (selectedStatus === OrderStatus.Processing) {
        if (!order.shippingAddress) {
           toast.error( "Đơn hàng này thiếu thông tin địa chỉ để báo sang GHN");
           setUpdating(false);
           return;
        }

        const toPhone = normalizeVietnamPhone(deliveryPhone)
        if (!isVietnamPhoneLocal(toPhone)) {
          toast.error(
            "Thiếu số điện thoại người nhận hợp lệ. GHN bắt buộc có SĐT (kiểm tra SĐT giao hàng trên đơn).",
            { id: "ghn-toast" },
          )
          setUpdating(false)
          return
        }

        toast.loading("Đang đẩy vận đơn sang phần mềm GHN...", { id: "ghn-toast" })
        const { parseAddressToGHNIds } = await import('@/lib/ghn-utils')
        const { ghnService } = await import('@/services/ghn')
        
        try {
          const { districtId, wardCode } = await parseAddressToGHNIds(order.shippingAddress)
          const fallbackWeight = order.items?.length ? order.items.length * 500 : 500;
          const ghnRes = await ghnService.createOrder({
            payment_type_id: 2,
            required_note: 'CHOXEMHANGKHONGTHU',
            weight: fallbackWeight,
            length: 10,
            width: 10,
            height: 10,
            to_name: order.customerName || "Khách Hàng",
            to_phone: toPhone,
            to_address: order.shippingAddress,
            to_ward_code: wardCode,
            to_district_id: districtId,
            service_type_id: 2,
            items: order.items?.map(item => ({
               name: item.productName,
               quantity: item.quantity,
               price: item.unitPrice,
               weight: 500
            })) || [{ name: "Sản phẩm", quantity: 1, weight: 500 }]
          }, order.shopGhnShopId ?? undefined)
          
          trackingCodeToSave = ghnRes.order_code
          toast.success("Mã vận đơn: " + trackingCodeToSave, { id: "ghn-toast" })
        } catch (ghnErr) {
          toast.error(ghnErr instanceof Error ? ghnErr.message : "Sự cố tạo đơn GHN Test", { id: "ghn-toast" })
          setUpdating(false)
          return
        }
      }

      const res = await updateMyOrderStatus(order.id, {
        status: selectedStatus,
        note: note.trim() || undefined,
        trackingCode: trackingCodeToSave
      })
      if (res.success) {
        toast.success(res.message ?? "Cập nhật trạng thái thành công")
        setShowStatusDialog(false)
        await load()
      } else {
        toast.error(res.message ?? "Lỗi cập nhật trạng thái")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật")
    } finally {
      setUpdating(false)
    }
  }

  const handleApproveCancel = async () => {
    if (!order) return
    setApprovingCancel(true)
    try {
      const res = await approveCancelRequest(order.id)
      if (res.success) {
        toast.success(res.message ?? "Đã phê duyệt hủy đơn")
        await load()
      } else {
        toast.error(res.message ?? "Lỗi phê duyệt")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi phê duyệt")
    } finally {
      setApprovingCancel(false)
    }
  }

  const handleRejectCancel = async () => {
    if (!order) return
    setRejectingCancel(true)
    try {
      const res = await rejectCancelRequest(order.id, rejectNote.trim() || undefined)
      if (res.success) {
        toast.success(res.message ?? "Đã từ chối yêu cầu hủy")
        setShowRejectDialog(false)
        setRejectNote("")
        await load()
      } else {
        toast.error(res.message ?? "Lỗi từ chối")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi từ chối")
    } finally {
      setRejectingCancel(false)
    }
  }

  const deliveryDisplayPhone = order
    ? formatPhoneVn(order.shipPhone, "—") : "—"

  const cfg = order ? statusConfig[order.status] : null
  const subtotal = order?.items?.reduce((s, i) => s + i.totalPrice, 0) ?? 0
  const subtotalForFee =
    order?.subtotal != null && order.subtotal > 0 ? order.subtotal : subtotal
  const itemCount = order?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const paid = order ? order.status !== OrderStatus.PendingPayment : false
  const isEndedOrder =
    order?.status === OrderStatus.Cancelled || order?.status === OrderStatus.Refunded
  const hasPendingCancelRequest = !!(order?.cancelRequestedAt && order.status === OrderStatus.Processing)

  return (
    <>
      <SetHeaderActions>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <IconRefresh className="mr-1.5 size-4" />
            Làm mới
          </Button>
          {canUpdate && (
            <Button size="sm" onClick={() => handleOpenStatusDialog()} className="gap-1.5 shadow-sm">
              <IconCircleCheck className="size-4" />
              Cập nhật trạng thái
            </Button>
          )}
        </div>
      </SetHeaderActions>

      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 pb-28 md:pb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/orders">Đơn hàng</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {loading ? "Chi tiết đơn hàng" : `#${order?.orderCode ?? "—"}`}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {loading ? (
          <DetailSkeleton />
        ) : order ? (
          <>
            {isEndedOrder ? (
              <StatusTimeline
                currentStatus={order.status}
                cancelReason={order.cancelReason}
                statusTimeline={order.statusTimeline}
              />
            ) : (
              <Card className="rounded shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <StatusTimeline
                    currentStatus={order.status}
                    cancelReason={order.cancelReason}
                    statusTimeline={order.statusTimeline}
                  />
                </CardContent>
              </Card>
            )}

            {/* Banner yêu cầu hủy đơn đang chờ shop xử lý */}
            {hasPendingCancelRequest && (
              <Card className="rounded shadow-sm overflow-hidden border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <IconAlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Khách hàng yêu cầu hủy đơn
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        {order?.cancelReason
                          ? `Lý do: ${order.cancelReason}`
                          : "Khách không cung cấp lý do."}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                        {order?.cancelRequestedAt && <>Gửi lúc {fmtDate(order.cancelRequestedAt)}.</>}
                        {order?.cancelRequestDeadline && (
                          <> Phải phản hồi trước <strong>{fmtDate(order.cancelRequestDeadline)}</strong> — quá hạn đơn tự động bị hủy.</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleApproveCancel()}
                      disabled={approvingCancel || rejectingCancel}
                      className="text-xs"
                    >
                      {approvingCancel ? "Đang xử lý..." : "Phê duyệt hủy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={approvingCancel || rejectingCancel}
                      className="text-xs"
                    >
                      Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded shadow-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-medium font-semibold">Thông tin đơn hàng đơn giản</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-5">
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Mã đơn hàng</p>
                  <p className="mt-1 font-mono text-sm font-bold">{order.orderCode}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Ngày đặt hàng</p>
                  <p className="mt-1 text-sm font-semibold">{fmtDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Trạng thái thanh toán</p>
                  <p className="mt-1 text-sm font-semibold">{paid ? "Đã thanh toán" : "Chưa thanh toán"}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Dự kiến giao hàng</p>
                  <p className="mt-1 text-sm font-semibold">
                    {order.estimatedDeliveryDate ? fmtDate(order.estimatedDeliveryDate) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Đối tác vận chuyển</p>
                  <p className="mt-1 text-sm font-semibold">
                    {order.shippingProvider ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <Card className="rounded shadow-sm overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-medium font-semibold flex items-center gap-2">
                      Thông tin sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {(order.items?.length ?? 0) === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <IconShoppingBag className="size-6 opacity-30" />
                      </div>
                      <p className="text-sm font-medium opacity-50">Không có sản phẩm</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-muted/30">
                          <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <th className="px-3 py-2.5 font-semibold">Sản phẩm</th>
                            <th className="px-3 py-2.5 font-semibold text-left">Số lượng</th>
                            <th className="px-3 py-2.5 font-semibold text-left">Đơn giá</th>
                            <th className="px-5 py-2.5 font-semibold text-left">Tổng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {order.items!.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="size-10 rounded-lg border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
                                    {item.productThumbnailUrl ? (
                                      <img src={item.productThumbnailUrl} alt={item.productName} className="size-full object-cover" />
                                    ) : (
                                      <IconPackage className="size-4 text-muted-foreground/60" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{item.productName}</p>
                                    {item.variantName ? (
                                      <p className="text-xs text-muted-foreground truncate">{item.variantName}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-left tabular-nums">x{item.quantity}</td>
                              <td className="px-3 py-3 text-left tabular-nums">{currency(item.unitPrice)}</td>
                              <td className="px-5 py-3 text-left font-semibold tabular-nums">{currency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded shadow-sm overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-medium font-semibold flex items-center gap-2">Thông tin khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-md border bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                      <IconUser className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Tên khách hàng</p>
                      <p className="text-sm font-semibold">{order.customerName ?? "Chưa rõ"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-md border bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                      <IconPhone className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Số điện thoại người nhận</p>
                      <p className="text-sm font-medium tabular-nums">{deliveryDisplayPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-md border bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                      <IconMail className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all">{order.customerEmail ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-md border bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                      <IconMapPin className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Địa chỉ giao hàng</p>
                      <p className="text-sm font-medium break-words">{order.shippingAddress ?? "Chưa có địa chỉ"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <Card className="rounded shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-5 bg-muted/20 border-b">
                  <CardTitle className="text-medium font-semibold flex items-center gap-2">
                    Trạng thái thanh toán
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[11px] ${paid ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"}`}
                    >
                      {paid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tổng phụ ({itemCount} sản phẩm)</span>
                    <span className="font-medium tabular-nums">{currency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium tabular-nums">{currency(order.shippingFee)}</span>
                  </div>
                  {order.platformFeePercent != null && subtotalForFee > 0 && (
                    <div className="rounded-lg border border-violet-200/70 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-950/20 px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                        Lợi nhuận shop (sau phí nền tảng)
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Phí tính trên tiền hàng, không tính phí ship. Khách trả: vẫn theo tổng cộng bên dưới.
                      </p>
                      {order.platformFeeSettled &&
                      order.platformFeeAmount != null &&
                      order.netToSellerAfterPlatformFee != null ? (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Phí sàn (đã quyết toán)</span>
                            <span className="font-medium tabular-nums text-amber-800 dark:text-amber-300">
                              −{currency(order.platformFeeAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Về ví (phần tiền hàng)</span>
                            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {currency(order.netToSellerAfterPlatformFee)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Phí sàn ước tính ({order.platformFeePercent}%)</span>
                            <span className="font-medium tabular-nums text-amber-800 dark:text-amber-300">
                              −{currency(
                                platformFeeVndFromGross(subtotalForFee, order.platformFeePercent)
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Dự kiến về ví (phần tiền hàng)</span>
                            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {currency(
                                order.estimatedNetAfterPlatformFee != null
                                  ? order.estimatedNetAfterPlatformFee
                                  : estimatedNetAfterPlatformFeeVnd(subtotalForFee, order.platformFeePercent)
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Tổng tiền</span>
                    <span className="text-lg font-black text-primary">{currency(order.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>

              {(order.trackingCode || order.shippingProvider || order.estimatedDeliveryDate || order.actualDeliveryDate) && (
                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b">
                    <CardTitle className="text-medium font-semibold flex items-center gap-2">
                      Thông tin vận chuyển
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.trackingCode && (
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-md border bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                          <IconBarcode className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Mã vận đơn</p>
                          <p className="text-sm font-semibold font-mono">{order.trackingCode}</p>
                        </div>
                      </div>
                    )}
                    {order.actualDeliveryDate && (
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-md border bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <IconCheck className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Giao thành công lúc</p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtDate(order.actualDeliveryDate)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : null}
      </div>

      {!loading && order && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 rounded-xl aspect-square p-0">
            <IconRefresh className="size-4" />
          </Button>
          {canUpdate ? (
            <Button size="sm" onClick={() => handleOpenStatusDialog()} className="flex-1 gap-1.5 h-9 rounded-xl shadow-sm">
              <IconCircleCheck className="size-3.5" />
              Cập nhật trạng thái
            </Button>
          ) : (
            <div className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-sm font-semibold ${cfg?.badgeCls ?? ""}`}>
              {cfg?.icon}
              {cfg?.label ?? "—"}
            </div>
          )}
        </div>
      )}

      <Dialog open={showStatusDialog} onOpenChange={(v) => { if (!v) setShowStatusDialog(false) }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <IconCircleCheck className="size-4" />
              </div>
              Cập nhật trạng thái đơn hàng
            </DialogTitle>
            <DialogDescription>
              Đơn hàng <span className="font-mono font-bold text-foreground">#{order?.id.slice(0, 8).toUpperCase()}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Trạng thái mới
              </Label>
              <Select
                value={selectedStatus !== null ? String(selectedStatus) : ""}
                onValueChange={(v) => setSelectedStatus(Number(v))}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Chọn trạng thái mới" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {transitions.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      <div className="flex items-center gap-2">
                        {statusConfig[s]?.icon}
                        {OrderStatusLabels[s] ?? `Trạng thái ${s}`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ghi chú <span className="normal-case font-normal opacity-60">(không bắt buộc)</span>
              </Label>
              <Input
                placeholder="Ghi chú cho khách hàng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowStatusDialog(false)} disabled={updating}>
              Hủy bỏ
            </Button>
            <Button
              className="flex-1 rounded-xl gap-1.5"
              onClick={handleUpdateStatus}
              disabled={updating || selectedStatus === null}
            >
              {updating ? (
                <><div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Đang xử lý...</>
              ) : (
                <><IconCheck className="size-3.5" /> Xác nhận</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối yêu cầu hủy */}
      <Dialog open={showRejectDialog} onOpenChange={(v) => { if (!v) { setShowRejectDialog(false); setRejectNote("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu hủy đơn</DialogTitle>
            <DialogDescription>
              Đơn hàng sẽ tiếp tục được xử lý. Bạn có thể nhập lý do để thông báo cho khách.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-note" className="text-sm font-medium">
              Lý do từ chối <span className="text-muted-foreground font-normal">(không bắt buộc)</span>
            </Label>
            <Input
              id="reject-note"
              placeholder="Ví dụ: Đơn hàng đã được đóng gói xong, không thể hủy..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              maxLength={300}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectNote("") }} disabled={rejectingCancel}>
              Bỏ qua
            </Button>
            <Button onClick={() => void handleRejectCancel()} disabled={rejectingCancel}>
              {rejectingCancel ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
