"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconExternalLink, IconShoppingCart } from "@tabler/icons-react"
import { OrderStatus, OrderStatusLabels } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"
import { SortableTableHead } from "@/components/common/table-sorting"
import type { SortConfig } from "@/components/common/table-sorting"
import TablePagination from "@/components/common/table-pagination"
import { formatDateVN as formatDate, formatPhoneVn, formatPriceVND as currency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const statusColors: Record<number, string> = {
  [OrderStatus.PendingPayment]: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  [OrderStatus.PendingConfirmation]: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  [OrderStatus.Confirmed]: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [OrderStatus.Processing]: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  [OrderStatus.Shipping]: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  [OrderStatus.Delivered]: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [OrderStatus.Completed]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  [OrderStatus.Cancelled]: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  [OrderStatus.Refunded]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
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
  actionLoading: boolean
  onUpdateStatus: (orderId: string, newStatus: number) => void | Promise<void>
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
  actionLoading,
  onUpdateStatus,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Mã đơn hàng</TableHead>
              <SortableTableHead sortKey="customerName" currentSort={sort} onSort={onSort}>Khách hàng</SortableTableHead>
              <SortableTableHead sortKey="createdAt" currentSort={sort} onSort={onSort}>Ngày đặt</SortableTableHead>
              <SortableTableHead sortKey="status" currentSort={sort} onSort={onSort}>Trạng thái</SortableTableHead>
              <SortableTableHead sortKey="totalAmount" currentSort={sort} onSort={onSort}>Tổng tiền</SortableTableHead>
              <TableHead className="hidden lg:table-cell max-w-[220px]">Địa chỉ</TableHead>
              <TableHead
                className="w-[1%] whitespace-nowrap text-center"
                title="Xem chi tiết đơn"
              >
                
              </TableHead>
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
                        #{order.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customerName ?? "Chưa rõ"}</p>
                        {(order.shipPhone ?? order.customerPhone) && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatPhoneVn(order.shipPhone ?? order.customerPhone)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn("font-medium", statusColors[order.status] ?? "")}
                      >
                        {OrderStatusLabels[order.status] ?? "Trạng thái lỗi"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm tabular-nums">
                      {currency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[min(220px,22vw)]">
                      <p className="text-sm text-muted-foreground truncate" title={order.shippingAddress ?? "—"}>
                        {order.shippingAddress ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell
                      className="align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1 sm:justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100"
                          title="Xem chi tiết đơn"
                          asChild
                        >
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
