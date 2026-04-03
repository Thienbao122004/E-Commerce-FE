"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconRefresh,
  IconUser,
  IconPhone,
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
  [OrderStatus.Pending]: {
    label: "Chờ xác nhận",
    dotCls: "bg-yellow-500",
    badgeCls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    icon: <IconClock className="size-4" />,
  },
  [OrderStatus.Confirmed]: {
    label: "Đã xác nhận",
    dotCls: "bg-blue-500",
    badgeCls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: <IconCircleCheck className="size-4" />,
  },
  [OrderStatus.Shipping]: {
    label: "Đang giao",
    dotCls: "bg-cyan-500",
    badgeCls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    icon: <IconTruck className="size-4" />,
  },
  [OrderStatus.Delivered]: {
    label: "Đã giao",
    dotCls: "bg-emerald-500",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: <IconCheck className="size-4" />,
  },
  [OrderStatus.Cancelled]: {
    label: "Đã hủy",
    dotCls: "bg-red-500",
    badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: <IconX className="size-4" />,
  },
  [OrderStatus.Returned]: {
    label: "Trả hàng",
    dotCls: "bg-zinc-500",
    badgeCls: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
    icon: <IconPackage className="size-4" />,
  },
}

// ── Status timeline steps ──
const STATUS_STEPS = [
  OrderStatus.Pending,
  OrderStatus.Confirmed,
  OrderStatus.Shipping,
  OrderStatus.Delivered,
]

function StatusTimeline({ currentStatus }: { currentStatus: number }) {
  const isCancelled = currentStatus === OrderStatus.Cancelled
  const isReturned = currentStatus === OrderStatus.Returned

  if (isCancelled || isReturned) {
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

  const handleOpenStatusDialog = () => {
    setSelectedStatus(transitions[0] ?? null)
    setNote("")
    setShowStatusDialog(true)
  }

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === null) return
    setUpdating(true)
    try {
      const res = await updateMyOrderStatus(order.id, {
        status: selectedStatus,
        note: note.trim() || undefined,
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
                  {loading ? "Đang tải..." : `Đơn hàng #${order?.id.slice(0, 8).toUpperCase()}`}
                </h1>
                {!loading && cfg && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeCls}`}>
                    <span className={`size-1.5 rounded-full ${cfg.dotCls}`} />
                    {cfg.label}
                  </span>
                )}
              </div>
              {!loading && order && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  <IconCalendar className="inline size-3 mr-1 align-middle" />
                  {fmtDate(order.createdAt)}
                </p>
              )}
            </div>
          </div>

          {!loading && order && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-9 rounded-xl">
                <IconRefresh className="size-3.5" />
                Tải lại
              </Button>
              {canUpdate && (
                <Button size="sm" onClick={handleOpenStatusDialog} className="gap-1.5 h-9 rounded-xl shadow-sm">
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

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

              <div className="flex flex-col gap-4">
                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <IconShoppingBag className="size-3.5" />
                      </div>
                      Sản phẩm đặt hàng
                      <Badge variant="secondary" className="ml-auto rounded-lg text-[11px] font-semibold tabular-nums">
                        {order.items?.length ?? 0} sản phẩm
                      </Badge>
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
                      <div className="divide-y">
                        {order.items!.map((item, idx) => (
                          <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                            {/* Index */}
                            <div className="size-7 rounded-lg bg-muted/50 text-muted-foreground flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm leading-tight truncate" title={item.productName}>
                                {item.productName}
                              </p>
                              {item.variantName && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-lg font-medium">
                                  {item.variantName}
                                </span>
                              )}
                            </div>
                            {/* Price breakdown */}
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-primary tabular-nums">{currency(item.totalPrice)}</p>
                              <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                                {currency(item.unitPrice)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Totals ── */}
                    {(order.items?.length ?? 0) > 0 && (
                      <div className="border-t bg-muted/10 px-5 py-4 space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Tạm tính</span>
                          <span className="tabular-nums font-medium">{currency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Phí vận chuyển</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Miễn phí</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Tổng cộng</span>
                          <span className="text-lg font-black text-primary tabular-nums">{currency(order.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded shadow-sm overflow-hidden">
                  <CardContent>
                    {order.shippingAddress ? (
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                          <IconMapPin className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-relaxed mt-2">{order.shippingAddress}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Chưa có địa chỉ giao hàng</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-3">
                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <IconUser className="size-3.5" />
                      </div>
                      Thông tin khách hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {order.customerName ? order.customerName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{order.customerName ?? "Chưa rõ"}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{order.customerId.slice(0, 12)}...</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {order.customerPhone && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="size-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                            <IconPhone className="size-3.5" />
                          </div>
                          <span className="font-medium tabular-nums">{order.customerPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="size-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                          <IconCalendar className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Đặt lúc</p>
                          <p className="font-medium">{fmtDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <IconHash className="size-3.5" />
                      </div>
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Mã đơn hàng</span>
                      <span className="font-mono text-xs font-bold bg-muted/60 px-2 py-1 rounded-lg">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Trạng thái</span>
                      {cfg && (
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg border ${cfg.badgeCls}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Số lượng SP</span>
                      <span className="text-sm font-bold tabular-nums">{order.items?.length ?? 0}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">Tổng tiền</span>
                      <span className="text-base font-black text-primary tabular-nums">{currency(order.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Mobile sticky bar ── */}
      {!loading && order && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 rounded-xl aspect-square p-0">
            <IconRefresh className="size-4" />
          </Button>
          {canUpdate ? (
            <Button size="sm" onClick={handleOpenStatusDialog} className="flex-1 gap-1.5 h-9 rounded-xl shadow-sm">
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

      {/* ── Update status dialog ── */}
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
