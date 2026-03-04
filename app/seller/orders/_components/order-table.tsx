"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconShoppingCart,
} from "@tabler/icons-react"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import { validTransitions } from "./order-status-dialog"
import type { SellerOrder } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })

const statusColors: Record<number, string> = {
  [OrderStatus.Pending]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  [OrderStatus.Confirmed]: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [OrderStatus.Shipping]: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  [OrderStatus.Delivered]: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [OrderStatus.Cancelled]: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  [OrderStatus.Returned]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[80px]" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

const PAGE_SIZE_OPTIONS = [
  { label: "10 / trang", value: "10" },
  { label: "20 / trang", value: "20" },
  { label: "50 / trang", value: "50" },
]

type Props = {
  orders: SellerOrder[]
  loading: boolean
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  onOpenStatusDialog: (orderId: string, currentStatus: number) => void
  onPageChange: (p: number) => void
  onPageSizeChange?: (size: number) => void
}

export function OrderTable({
  orders,
  loading,
  totalCount,
  totalPages,
  page,
  pageSize,
  onOpenStatusDialog,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Mã đơn hàng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="hidden lg:table-cell">Địa chỉ</TableHead>
              <TableHead className="w-[100px] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <IconShoppingCart className="size-7 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium">Chưa có đơn hàng nào</p>
                      <p className="text-xs mt-1">Đơn hàng mới sẽ xuất hiện ở đây</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, idx) => {
                const canUpdate = (validTransitions[order.status] ?? []).length > 0
                return (
                  <TableRow key={order.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customerName ?? "Chưa rõ"}</p>
                        {order.customerPhone && (
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs font-medium ${statusColors[order.status] ?? ""}`}>
                        {OrderStatusLabels[order.status] ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm tabular-nums">
                      {currency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                        {order.shippingAddress ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {canUpdate && (
                          <Button
                            variant="outline" size="sm" className="h-7 text-xs"
                            onClick={() => onOpenStatusDialog(order.id, order.status)}
                          >
                            Xử lý
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link href={`/seller/orders/${order.id}`}>
                            <IconExternalLink className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Hiển thị <span className="font-medium text-foreground">{startItem}–{endItem}</span> trong số{" "}
            <span className="font-medium text-foreground">{totalCount}</span> đơn hàng
          </p>
          <div className="flex items-center gap-2">
            {onPageSizeChange && (
              <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[70px] text-center text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
