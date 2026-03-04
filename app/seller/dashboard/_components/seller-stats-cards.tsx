"use client"

import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconWallet,
  IconClock,
  IconArrowDownRight,
  IconCategory,
  IconCircleCheck,
} from "@tabler/icons-react"

import {
  Card,
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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* ── Revenue Card ── */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconCurrencyDollar className="size-4" />
            Tổng doanh thu
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currency(stats.totalRevenue)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <IconWallet className="size-3.5" />
            <span className="font-medium">
              Khả dụng: {wallet ? currency(wallet.availableBalance) : "—"}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1">
              <IconClock className="size-3.5" />
              Chờ: {wallet ? currency(wallet.pendingBalance) : "—"}
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1">
              <IconArrowDownRight className="size-3.5" />
              Rút: {wallet ? currency(wallet.totalWithdrawn) : "—"}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* ── Orders Card ── */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconShoppingCart className="size-4" />
            Tổng đơn hàng
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(stats.totalOrders)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">
              đơn
            </span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-sm">
          Tất cả đơn hàng bạn đã nhận được
        </CardFooter>
      </Card>

      {/* ── Customers Card ── */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconUsers className="size-4" />
            Khách hàng
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(stats.totalCustomers)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">
              khách
            </span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-sm">
          Khách hàng đã mua hàng tại cửa hàng
        </CardFooter>
      </Card>

      {/* ── Products & Categories Card ── */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconPackage className="size-4" />
            Sản phẩm
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(stats.totalProducts)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">
              sản phẩm
            </span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <IconCircleCheck className="size-3.5 text-green-600 dark:text-green-400" />
            <span>{fmt(stats.activeProducts)} đang hoạt động</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <IconCategory className="size-3.5" />
            <span>{fmt(stats.categoriesCount)} danh mục</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
