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
import type { SellerDashboardStats, SellerWallet } from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const fmt = (v: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v)

type Props = {
  stats: SellerDashboardStats | null
  wallet: SellerWallet | null
  loading: boolean
}

export function SellerStatsCards({ stats, wallet, loading }: Props) {
  if (loading || !stats) {
    return (
      <StatsGrid cols={4} className="px-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCard key={i} loading label="" />
        ))}
      </StatsGrid>
    )
  }

  return (
    <StatsGrid cols={4} className="px-4 lg:px-6">
      <StatsCard
        label="Tổng doanh thu"
        value={currency(stats.totalRevenue)}
        icon={<IconCurrencyDollar />}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        footer={
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <IconWallet className="size-3.5" />
              Khả dụng: {wallet ? currency(wallet.availableBalance) : "—"}
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
            {wallet && (wallet.totalRefunded ?? 0) > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Hoàn tác đơn: {currency(wallet.totalRefunded ?? 0)}
              </div>
            )}
          </div>
        }
      />

      <StatsCard
        label="Tổng đơn hàng"
        value={
          <>
            {fmt(stats.totalOrders)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">đơn</span>
          </>
        }
        icon={<IconShoppingCart />}
        iconBg="bg-blue-50 dark:bg-blue-950"
        iconColor="text-blue-500"
        subText="Tất cả đơn hàng bạn đã nhận được"
      />

      <StatsCard
        label="Khách hàng"
        value={
          <>
            {fmt(stats.totalCustomers)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">khách</span>
          </>
        }
        icon={<IconUsers />}
        iconBg="bg-violet-50 dark:bg-violet-950"
        iconColor="text-violet-500"
        subText="Khách hàng đã mua hàng tại cửa hàng"
      />

      <StatsCard
        label="Sản phẩm"
        value={
          <>
            {fmt(stats.totalProducts)}
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">sản phẩm</span>
          </>
        }
        icon={<IconPackage />}
        iconBg="bg-orange-50 dark:bg-orange-950"
        iconColor="text-orange-500"
        footer={
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <IconCircleCheck className="size-3.5 text-green-600 dark:text-green-400" />
              {fmt(stats.activeProducts)} đang hoạt động
            </div>
            <div className="flex items-center gap-1.5">
              <IconCategory className="size-3.5" />
              {fmt(stats.categoriesCount)} danh mục
            </div>
          </div>
        }
      />
    </StatsGrid>
  )
}
