"use client"

import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconUsers,
  IconCategory,
  IconTrendingUp,
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
import type { SellerDashboardStats, SellerWallet } from "@/types/seller-dashboard"

type Props = {
  stats: SellerDashboardStats | null
  wallet: SellerWallet | null
  loading: boolean
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

export function SellerStatsCards({ stats, wallet, loading }: Props) {
  const currency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  const fmt = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)

  if (loading || !stats) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      icon: IconCurrencyDollar,
      label: "Tổng doanh thu",
      value: currency(stats.totalRevenue),
      badge: wallet ? `Khả dụng: ${currency(wallet.availableBalance)}` : "",
      badgePositive: true,
      footer: wallet
        ? `Đang chờ: ${currency(wallet.pendingBalance)}`
        : "",
      sub: wallet
        ? `Đã rút: ${currency(wallet.totalWithdrawn)}`
        : "",
    },
    {
      icon: IconShoppingCart,
      label: "Tổng đơn hàng",
      value: fmt(stats.totalOrders),
      badge: `${fmt(stats.totalOrders)} đơn`,
      badgePositive: true,
      footer: `Tổng đơn hàng của bạn`,
      sub: "",
    },
    {
      icon: IconUsers,
      label: "Tổng khách hàng",
      value: fmt(stats.totalCustomers),
      badge: `${fmt(stats.totalCustomers)} khách`,
      badgePositive: true,
      footer: "Khách hàng đã mua hàng",
      sub: "",
    },
    {
      icon: IconCategory,
      label: "Danh mục & Sản phẩm",
      value: `${fmt(stats.categoriesCount)} / ${fmt(stats.totalProducts)}`,
      badge: `${fmt(stats.activeProducts)} đang hoạt động`,
      badgePositive: true,
      footer: `${fmt(stats.categoriesCount)} danh mục · ${fmt(stats.totalProducts)} sản phẩm`,
      sub: "",
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
                <IconTrendingUp className="text-green-500" />
                {card.badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footer}
            </div>
            {card.sub && (
              <div className="text-muted-foreground">{card.sub}</div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
