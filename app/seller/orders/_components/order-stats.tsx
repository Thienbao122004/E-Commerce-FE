"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  IconShoppingCart,
  IconAlertCircle,
  IconTruckDelivery,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
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

  const cards = [
    {
      icon: IconShoppingCart,
      label: "Tổng đơn hàng",
      value: totalCount.toLocaleString("vi-VN"),
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: IconAlertCircle,
      label: "Cần xử lý",
      value: String(pendingCount),
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: IconTruckDelivery,
      label: "Đang xử lý",
      value: String(processingCount),
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: IconCurrencyDollar,
      label: "Doanh thu (đã giao)",
      value: currency(totalRevenue),
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`size-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium truncate">
                  {card.label}
                </p>
                <p className={`text-xl font-bold tabular-nums ${card.valueColor ?? ""}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
