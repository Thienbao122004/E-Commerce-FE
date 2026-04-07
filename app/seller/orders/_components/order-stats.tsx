"use client"

import {
  IconShoppingCart,
  IconAlertCircle,
  IconTruckDelivery,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { OrderStatus } from "@/types/seller-dashboard"
import type { SellerOrder } from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"
import { formatNumberVN, formatPriceVND as currency } from "@/lib/formatters"

type Props = {
  orders: SellerOrder[]
  totalCount: number
  loading: boolean
}

export function OrderStats({ orders, totalCount, loading }: Props) {
  const pendingCount = orders.filter((o) => o.status === OrderStatus.Confirmed).length
  const processingCount = orders.filter(
    (o) => o.status === OrderStatus.Confirmed || o.status === OrderStatus.Processing || o.status === OrderStatus.Shipping
  ).length
  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.Completed)
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const cards = [
    {
      label: "Tổng đơn hàng",
      value: formatNumberVN(totalCount),
      icon: <IconShoppingCart />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Cần xử lý",
      value: pendingCount,
      icon: <IconAlertCircle />,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Đang xử lý",
      value: processingCount,
      icon: <IconTruckDelivery />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Doanh thu (đã giao)",
      value: currency(totalRevenue),
      icon: <IconCurrencyDollar />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
    },
  ]

  return (
    <StatsGrid cols={4}>
      {cards.map((card) => (
        <StatsCard key={card.label} loading={loading} {...card} />
      ))}
    </StatsGrid>
  )
}
