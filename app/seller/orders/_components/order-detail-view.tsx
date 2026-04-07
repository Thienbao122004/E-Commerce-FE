"use client"

import * as React from "react"
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
  IconAlertTriangle,
  IconChevronRight,
  IconHash,
  IconShoppingBag,
  IconBarcode,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/services/seller-dashboard"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import type { SellerOrderDetail } from "@/types/seller-dashboard"
import { validTransitions } from "./order-status-dialog"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency } from "@/lib/formatters"

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
  OrderStatus.Confirmed,
  OrderStatus.Processing,
  OrderStatus.Shipping,
  OrderStatus.Delivered,
  OrderStatus.Completed,
]

function StatusTimeline({ currentStatus }: { currentStatus: number }) {
  const isCancelled = currentStatus === OrderStatus.Cancelled
  const isRefunded = currentStatus === OrderStatus.Refunded

  if (isCancelled || isRefunded) {
    const cfg = statusConfig[currentStatus]
    return (
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${cfg.badgeCls}`}>
        <div className={`size-2 rounded-full ${cfg.dotCls}`} />
        <span className="text-sm font-semibold">{cfg.label}</span>
        <span className="text-xs opacity-70 ml-1">— Đơn hàng đã kết thúc</span>
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
  const canCancel = transitions.includes(OrderStatus.Cancelled)

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

      // Xử lý tạo đơn GHN trước khi update backend
      if (selectedStatus === OrderStatus.Processing) {
        if (!order.shippingAddress) {
           toast.error( "Đơn hàng này thiếu thông tin địa chỉ để báo sang GHN");
           setUpdating(false);
           return;
        }

        toast.loading("Đang đẩy vận đơn sang phần mềm GHN...", { id: "ghn-toast" })
        const { parseAddressToGHNIds } = await import('@/lib/ghn-utils')
        const { ghnService } = await import('@/services/ghn')
        
        try {
          const { districtId, wardCode } = await parseAddressToGHNIds(order.shippingAddress)
          const fallbackWeight = (order.items?.length || 1) * 500;

          const ghnRes = await ghnService.createOrder({
            payment_type_id: 2,
            required_note: 'CHOXEMHANGKHONGTHU',
            weight: fallbackWeight,
            length: 10,
            width: 10,
            height: 10,
            to_name: order.customerName || "Khách Hàng",
            to_phone: order.customerPhone || "0987654321",
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
          })
          
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

  const cfg = order ? statusConfig[order.status] : null
  const subtotal = order?.items?.reduce((s, i) => s + i.totalPrice, 0) ?? 0
  const itemCount = order?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const paid = order ? order.status !== OrderStatus.PendingPayment : false

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 pb-28 md:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-xl border shadow-sm hover:bg-muted"
              onClick={() => router.push("/seller/orders")}
            >
              <IconArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  {loading ? "Đang tải..." : `Đơn hàng #${order?.orderCode}`}
                </h1>
                {!loading && cfg && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeCls}`}>
                    <span className={`size-1.5 rounded-full ${cfg.dotCls}`} />
                    {cfg.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!loading && order && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-9 rounded-xl">
                <IconRefresh className="size-3.5" />
                Tải lại
              </Button>
              {canUpdate && (
                <Button size="sm" onClick={() => handleOpenStatusDialog()} className="gap-1.5 h-9 rounded-xl shadow-sm">
                  <IconCircleCheck className="size-3.5" />
                  Cập nhật trạng thái
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : order ? (
          <>
          <Card className="rounded shadow-sm overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <StatusTimeline currentStatus={order.status} />
              </CardContent>
            </Card>
            <Card className="rounded shadow-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-medium font-semibold">Thông tin đơn hàng đơn giản</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-5">
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Order ID</p>
                  <p className="mt-1 font-mono text-sm font-bold">{order.id.slice(0, 12).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Ngày đặt hàng</p>
                  <p className="mt-1 text-sm font-semibold">{fmtDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-wide font-semibold text-muted-foreground">Trạng thái thanh toán</p>
                  <p className="mt-1 text-sm font-semibold">{paid ? "Đã xử lý" : "Chưa thanh toán"}</p>
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
                      <p className="text-[11px] text-muted-foreground">Số điện thoại  </p>
                      <p className="text-sm font-medium tabular-nums">{order.customerPhone ?? "—"}</p>
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
                    <span className="font-medium tabular-nums">{currency(order.providerShippingFee)}</span>
                  </div>
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
    </>
  )
}
