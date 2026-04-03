"use client"

import {
  IconPackage,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconCircleX,
} from "@tabler/icons-react"
import type { SellerProduct } from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"
import { formatNumberVN, formatPriceVND as currency } from "@/lib/formatters"

type Props = {
  products: SellerProduct[]
  loading: boolean
}

export function InventoryStats({ products, loading }: Props) {
  const totalProducts = products.length
  const inventoryValue = products.reduce((sum, p) => sum + p.basePrice * (p.totalStock ?? 0), 0)
  const lowStock = products.filter((p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= 10).length
  const outOfStock = products.filter((p) => (p.totalStock ?? 0) === 0).length

  return (
    <StatsGrid cols={4}>
      <StatsCard
        loading={loading}
        label="Tổng sản phẩm"
        value={formatNumberVN(totalProducts)}
        icon={<IconPackage />}
        iconBg="bg-primary/10"
        iconColor="text-primary"
      />
      <StatsCard
        loading={loading}
        label="Giá trị kho"
        value={currency(inventoryValue)}
        icon={<IconCurrencyDollar />}
        iconBg="bg-blue-50 dark:bg-blue-950"
        iconColor="text-blue-500"
        valueColor="text-blue-600 dark:text-blue-400"
      />
      <StatsCard
        loading={loading}
        label="Sắp hết hàng"
        value={lowStock}
        icon={<IconAlertTriangle />}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        iconColor="text-orange-600 dark:text-orange-400"
        valueColor="text-orange-600 dark:text-orange-400"
        subText="Cần nhập thêm"
        className={lowStock > 0 ? "border-orange-200 dark:border-orange-800" : undefined}
      />
      <StatsCard
        loading={loading}
        label="Hết hàng"
        value={outOfStock}
        icon={<IconCircleX />}
        iconBg="bg-red-100 dark:bg-red-900/30"
        iconColor="text-red-600 dark:text-red-400"
        valueColor="text-red-600 dark:text-red-400"
        className={outOfStock > 0 ? "border-red-200 dark:border-red-800" : undefined}
      />
    </StatsGrid>
  )
}
