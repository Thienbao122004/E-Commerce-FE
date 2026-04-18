"use client"

import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconPackage,
  IconWallet,
  IconClock,
  IconArrowDownRight,
  IconCategory,
  IconCircleCheck,
  IconLock,
} from "@tabler/icons-react"
import {
  OrderStatus,
  type SellerDashboardStats,
  type SellerWallet,
  type SellerOrder,
} from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"
import { formatNumberVN as fmt, formatPriceVND as currency } from "@/lib/formatters"

type Props = {
  stats: SellerDashboardStats | null
  wallet: SellerWallet | null
  orders: SellerOrder[]
  loading: boolean
}

export function SellerStatsCards({ stats, wallet, orders, loading }: Props) {
  const processOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.Processing
  ).length
  const confirmedOrders = orders.filter(
    (o) => o.status === OrderStatus.Confirmed).length
  const processingOrders = orders.filter(
    (o) => o.status === OrderStatus.Shipping
  ).length
  const completedOrders = orders.filter(
    (o) => o.status === OrderStatus.Completed
  ).length
  const cancelledOrders = orders.filter(
    (o) => o.status === OrderStatus.Cancelled
  ).length
  const refundedOrders = orders.filter(
    (o) => o.status === OrderStatus.Refunded
  ).length
  const totalRefunded = wallet?.totalRefunded ?? 0
  const netRevenue = stats?.totalRevenue ?? 0

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
    <StatsGrid cols={3} className="px-4 lg:px-6">
      <StatsCard
        label="Doanh thu ròng"
        value={currency(netRevenue)}
        icon={<IconCurrencyDollar />}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        footer={
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <IconWallet className="size-3.5" />
              Khả dụng: {wallet ? currency(wallet.availableBalance) : "—"}
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconLock className="size-3.5 opacity-70" />
                Tạm giữ: {wallet ? currency(wallet.heldBalance ?? 0) : "—"}
              </div>
              <div className="flex items-center gap-1">
                <IconClock className="size-3.5" />
                Chờ rút: {wallet ? currency(wallet.pendingBalance) : "—"}
              </div>
              <div className="flex items-center gap-1">
                <IconArrowDownRight className="size-3.5" />
                Rút: {wallet ? currency(wallet.totalWithdrawn) : "—"}
              </div>
            </div>
            {totalRefunded > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Hoàn tác đơn: {currency(totalRefunded)}
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
        footer={
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <IconCircleCheck className="size-3.5" />
              Đã xác nhận: {fmt(confirmedOrders)} đơn
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconClock className="size-3.5 opacity-70" />
                Đang chuẩn bị: {fmt(processOrders)}
              </div>
              <div className="flex items-center gap-1">
                <IconShoppingCart className="size-3.5" />
                Đang giao: {fmt(processingOrders)}
              </div>
              <div className="flex items-center gap-1">
                <IconArrowDownRight className="size-3.5" />
                Hoàn thành: {fmt(completedOrders)}
              </div>
            </div>
            {cancelledOrders + refundedOrders > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Đơn hủy/hoàn tiền: {fmt(cancelledOrders + refundedOrders)}
              </div>
            )}
          </div>
        }
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
              <IconLock className="size-3.5 opacity-70" />
              {fmt(stats.totalProducts - stats.activeProducts)} đã ẩn
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
