"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconExternalLink, IconShoppingCart } from "@tabler/icons-react"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"
import { validTransitions } from "./order-status-dialog"
import { SortableTableHead } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import TablePagination from "@/components/common/table-pagination"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const formatDate = (ts: string) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

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
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[80px]" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

type Props = {
  orders: SellerOrder[]
  loading: boolean
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  sort: SortConfig | null
  onSort: (key: string) => void
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
  sort,
  onSort,
  onOpenStatusDialog,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Mã đơn hàng</TableHead>
              <SortableTableHead sortKey="customerName" currentSort={sort} onSort={onSort}>Khách hàng</SortableTableHead>
              <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={onSort}>Ngày đặt</SortableTableHead>
              <SortableTableHead sortKey="status" currentSort={sort} onSort={onSort}>Trạng thái</SortableTableHead>
              <SortableTableHead sortKey="totalAmount" currentSort={sort} onSort={onSort}>Tổng tiền</SortableTableHead>
              <TableHead className="hidden lg:table-cell">Địa chỉ</TableHead>
              <TableHead className="w-[100px] text-center"></TableHead>
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
                  <TableRow
                    key={order.id}
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/seller/orders/${order.id}`)}
                  >
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
                    <TableCell className="font-semibold text-sm tabular-nums">
                      {currency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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

      {!loading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={onPageChange}
          itemLabel="đơn hàng"
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={onPageSizeChange ? [10, 20, 50] : undefined}
        />
      )}
    </div>
  )
}
