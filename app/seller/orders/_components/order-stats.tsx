"use client"

import { Card, CardContent } from "@/components/ui/card"
import { IconShoppingCart } from "@tabler/icons-react"
import { OrderStatus } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

type Props = {
  orders: SellerOrder[]
  totalCount: number
  loading: boolean
}

export function OrderStats({ orders, totalCount, loading }: Props) {
  const pendingCount = orders.filter((o) => o.status === OrderStatus.Pending).length
  const processingCount = orders.filter(
    (o) => o.status === OrderStatus.Confirmed || o.status === OrderStatus.Shipping
  ).length
  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.Delivered)
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const dash = loading ? "—" : undefined

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <IconShoppingCart className="size-4 text-muted-foreground" />
            <p className="text-muted-foreground text-xs font-medium">Tổng đơn hàng</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{dash ?? totalCount.toLocaleString("vi-VN")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs font-medium">Cần xử lý</p>
          <p className="text-2xl font-bold tabular-nums text-orange-600">{dash ?? pendingCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs font-medium">Đang xử lý</p>
          <p className="text-2xl font-bold tabular-nums text-blue-600">{dash ?? processingCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs font-medium">Doanh thu (đã giao)</p>
          <p className="text-2xl font-bold tabular-nums text-green-600">{dash ?? currency(totalRevenue)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
