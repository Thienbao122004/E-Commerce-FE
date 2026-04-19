import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconShoppingCart,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconBuildingStore,
  IconChartBar,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatNumberVN as fmt, formatPriceVND as currency } from "@/lib/formatters"
import type { DashboardStats } from "@/types/dashboard"

type Props = {
  stats?: DashboardStats
  loading?: boolean
}

function SkeletonCard() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>
          <span className="bg-muted inline-block h-4 w-24 animate-pulse rounded" />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <span className="bg-muted inline-block h-8 w-32 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <span className="bg-muted inline-block h-3 w-40 animate-pulse rounded" />
        <span className="bg-muted inline-block h-3 w-28 animate-pulse rounded" />
      </CardFooter>
    </Card>
  )
}

export function SectionCards({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const growth = stats.revenue.growthPercentage
  const isGrowthPositive = growth >= 0

  const gmv = stats.completedOrderGmv ?? {
    totalGmv: 0,
    todayGmv: 0,
    thisMonthGmv: 0,
    lastMonthGmv: 0,
    growthPercentage: 0,
  }
  const gmvGrowth = gmv.growthPercentage
  const isGmvGrowthPositive = gmvGrowth >= 0

  const ord = stats.orders
  const confirmed = ord.confirmed ?? 0
  const delivered = ord.delivered ?? 0
  const refunded = ord.refunded ?? 0

  const cards = [
    {
      icon: IconCurrencyDollar,
      label: "Doanh thu sàn (phí)",
      value: currency(stats.revenue.totalRevenue),
      badge: `${isGrowthPositive ? "+" : ""}${growth.toFixed(1)}%`,
      badgePositive: isGrowthPositive,
      footer: `Tháng này: ${currency(stats.revenue.thisMonthRevenue)}`,
      sub: `Hôm nay: ${currency(stats.revenue.todayRevenue)}`,
    },
    {
      icon: IconShoppingCart,
      label: "Tổng đơn hàng",
      value: fmt(stats.orders.total),
      badge: `+${fmt(stats.orders.todayOrders)} hôm nay`,
      badgePositive: true,
      footer: `Tháng này: ${fmt(stats.orders.thisMonthOrders)} · Chờ: ${fmt(ord.pending)} · Đang xử lý: ${fmt(ord.processing)} · Đã xác nhận: ${fmt(confirmed)}`,
      sub: `Đã giao: ${fmt(delivered)} · Hoàn thành: ${fmt(ord.completed)} · Hủy: ${fmt(ord.cancelled)} · Hoàn tiền: ${fmt(refunded)}`,
    },
    {
      icon: IconUsers,
      label: "Người dùng",
      value: fmt(stats.users.total),
      badge: `+${fmt(stats.users.newThisMonth)} tháng này`,
      badgePositive: true,
      footer: `Hoạt động: ${fmt(stats.users.active)} · Khách: ${fmt(stats.users.customers)}`,
      sub: `Người bán: ${fmt(stats.users.sellers)} · Tạm khóa: ${fmt(stats.users.suspended)}`,
    },
    {
      icon: IconAlertTriangle,
      label: "Khiếu nại",
      value: fmt(stats.disputes.total),
      badge: `${fmt(stats.disputes.pending)} chờ xử lý`,
      badgePositive: false,
      footer: `Đang xem xét: ${fmt(stats.disputes.underReview)} · Đã giải quyết: ${fmt(stats.disputes.resolved)}`,
      sub: `Đã hoàn tiền: ${fmt(stats.disputes.refunded)}`,
    },
    {
      icon: IconBuildingStore,
      label: "Cửa hàng",
      value: fmt(stats.shops.total),
      badge: `+${fmt(stats.shops.newThisMonth)} tháng này`,
      badgePositive: true,
      footer: `Đang bán (đã duyệt): ${fmt(stats.shops.active)} · Chờ duyệt: ${fmt(stats.shops.pendingVerification)}`,
      sub: `Tạm khóa: ${fmt(stats.shops.suspended)}`,
    },
    {
      icon: IconChartBar,
      label: "GMV đơn hoàn thành",
      value: currency(gmv.totalGmv),
      badge: `${isGmvGrowthPositive ? "+" : ""}${gmvGrowth.toFixed(1)}%`,
      badgePositive: isGmvGrowthPositive,
      footer: `Tháng này: ${currency(gmv.thisMonthGmv)} · ${fmt(ord.completed)} đơn HT`,
      sub: `Hôm nay: ${currency(gmv.todayGmv)} · Tháng trước: ${currency(gmv.lastMonthGmv)}`,
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <card.icon className="size-4" />
              {card.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.badgePositive ? (
                  <IconTrendingUp className="text-green-500" />
                ) : (
                  <IconTrendingDown className="text-red-500" />
                )}
                {card.badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="truncate flex gap-2 font-medium">
              {card.footer}
            </div>
            <div className="text-muted-foreground">{card.sub}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
