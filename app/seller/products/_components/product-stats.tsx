"use client"

import { IconCircleCheck, IconFileDescription, IconPackage, IconShoppingBag } from "@tabler/icons-react"
import { ProductStatus } from "@/types/seller-dashboard"
import type { SellerProduct } from "@/types/seller-dashboard"
import { StatsCard, StatsGrid } from "@/components/common/stats-card"

type Props = {
  products: SellerProduct[]
  totalCount: number
  loading: boolean
}

export function ProductStats({ products, totalCount, loading }: Props) {
  const activeCount = products.filter((p) => p.status === ProductStatus.Active).length
  const draftCount = products.filter((p) => p.status === ProductStatus.Draft).length
  const totalStock = products.reduce((sum, p) => sum + (p.totalStock ?? 0), 0)

  const cards = [
    {
      label: "Tổng sản phẩm",
      value: totalCount,
      icon: <IconShoppingBag />,
      iconBg: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-500",
    },
    {
      label: "Đang bán",
      value: activeCount,
      icon: <IconCircleCheck />,
      iconBg: "bg-green-50 dark:bg-green-950",
      iconColor: "text-green-500",
      valueColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Bản nháp",
      value: draftCount,
      icon: <IconFileDescription />,
      iconBg: "bg-zinc-100 dark:bg-zinc-800",
      iconColor: "text-zinc-500",
      valueColor: "text-zinc-500",
    },
    {
      label: "Tổng tồn kho",
      value: totalStock.toLocaleString("vi-VN"),
      icon: <IconPackage />,
      iconBg: "bg-orange-50 dark:bg-orange-950",
      iconColor: "text-orange-500",
      valueColor: "text-orange-600 dark:text-orange-400",
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
