"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateVN, formatPriceVND as currency } from "@/lib/formatters"
import type { SellerOrder } from "@/types/seller-dashboard"
import { OrderStatusLabels } from "@/types/seller-dashboard"

type Props = {
  orders: SellerOrder[]
  loading: boolean
}

const statusColors: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  3: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  4: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  5: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="bg-muted size-10 animate-pulse rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted h-3 w-20 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`
  return formatDateVN(date)
}

export function SellerRecentOrders({ orders, loading }: Props) {
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <a
          href="/seller/dashboard/orders"
          className="text-sm text-primary hover:underline"
        >
          Xem danh sách
        </a>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-1 divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/30 px-1"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {(order.customerName ?? "K").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {order.customerName ?? "Khách hàng"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(order.createdAt)}
                  </p>
                </div>
                {/* Status */}
                <Badge
                  variant="secondary"
                  className={`shrink-0 text-xs ${statusColors[order.status] ?? ""}`}
                >
                  {OrderStatusLabels[order.status] ?? "Không rõ"}
                </Badge>
                {/* Amount */}
                <span className="shrink-0 text-sm font-semibold text-right w-28">
                  {currency(order.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Chưa có đơn hàng nào
          </div>
        )}
      </CardContent>
    </Card>
  )
}
