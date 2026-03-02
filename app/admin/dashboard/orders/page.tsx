"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconExternalLink,
  IconFilter,
} from "@tabler/icons-react"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useOrders } from "@/hooks/use-orders"
import {
  OrderStatus,
  OrderStatusLabels,
  OrderStatusColors,
  ValidOrderTransitions,
} from "@/types/order"
import type { AdminOrder } from "@/types/order"

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

const statusTabs = [
  { label: "Tất cả", value: null },
  { label: "Chờ thanh toán", value: OrderStatus.PendingPayment },
  { label: "Chờ xác nhận", value: OrderStatus.PendingConfirmation },
  { label: "Đã xác nhận", value: OrderStatus.Confirmed },
  { label: "Đang chuẩn bị", value: OrderStatus.Processing },
  { label: "Đang giao", value: OrderStatus.Shipping },
  { label: "Đã giao", value: OrderStatus.Delivered },
  { label: "Hoàn thành", value: OrderStatus.Completed },
  { label: "Đã hủy", value: OrderStatus.Cancelled },
  { label: "Hoàn tiền", value: OrderStatus.Refunded },
]

function UpdateStatusDialog({
  open,
  onOpenChange,
  order,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: AdminOrder | null
  loading: boolean
  onConfirm: (newStatus: number, reason: string) => void
}) {
  const [newStatus, setNewStatus] = React.useState<string>("")
  const [reason, setReason] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setNewStatus("")
      setReason("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
          <DialogDescription>
            Đơn hàng: {order?.id.slice(0, 8)}... · Khách hàng: {order?.customerName}
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
                {(ValidOrderTransitions[order?.status ?? 0] ?? []).map((s) => (
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
              placeholder="Nhập lý do thay đổi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={() => onConfirm(Number(newStatus), reason)}
            disabled={loading || !newStatus}
          >
            {loading ? "Đang xử lý..." : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function OrdersPage() {
  const {
    orders,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setStatus,
    setSearch,
    updateStatus,
    reload,
  } = useOrders()

  const [searchInput, setSearchInput] = React.useState("")
  const [dialogOrder, setDialogOrder] = React.useState<AdminOrder | null>(null)
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearch(val), 400)
  }

  const handleStatusUpdate = async (newStatus: number, reason: string) => {
    if (!dialogOrder) return
    const ok = await updateStatus(dialogOrder.id, newStatus, reason || undefined)
    if (ok) setDialogOrder(null)
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm theo mã đơn, khách hàng, shop..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select
                value={params.status === null ? "all" : String(params.status)}
                onValueChange={(v) => setStatus(v === "all" ? null : Number(v))}
              >
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusTabs.map((tab) => (
                    <SelectItem key={tab.value ?? "all"} value={tab.value === null ? "all" : String(tab.value)}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton />
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy đơn hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, idx) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(params.page - 1) * 20 + idx + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm font-medium">{order.customerName}</span>
                          {order.shipPhone && (
                            <p className="text-xs text-muted-foreground">{order.shipPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.shopName}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {currency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${OrderStatusColors[order.status] ?? ""}`}
                        >
                          {OrderStatusLabels[order.status] ?? order.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <IconExternalLink className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setDialogOrder(order)}
                            disabled={actionLoading || (ValidOrderTransitions[order.status] ?? []).length === 0}
                          >
                            Đổi TT
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Trang {params.page} / {totalPages} · {totalCount} đơn hàng
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page - 1)}
                  disabled={params.page <= 1}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(params.page + 1)}
                  disabled={params.page >= totalPages}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status update dialog */}
      <UpdateStatusDialog
        open={dialogOrder !== null}
        onOpenChange={(v) => { if (!v) setDialogOrder(null) }}
        order={dialogOrder}
        loading={actionLoading}
        onConfirm={handleStatusUpdate}
      />
    </>
  )
}
