"use client"

import { Card, CardContent } from "@/components/ui/card"
import { IconCircleCheck, IconFileDescription, IconPackage, IconShoppingBag } from "@tabler/icons-react"
import { ProductStatus } from "@/types/seller-dashboard"
import type { SellerProduct } from "@/types/seller-dashboard"

type Props = {
  products: SellerProduct[]
  totalCount: number
  loading: boolean
}

export function ProductStats({ products, totalCount, loading }: Props) {
  const activeCount = products.filter((p) => p.status === ProductStatus.Active).length
  const draftCount = products.filter((p) => p.status === ProductStatus.Draft).length
  const totalStock = products.reduce((sum, p) => sum + (p.totalStock ?? 0), 0)
  const dash = loading ? "—" : undefined

  const stats = [
    { label: "Tổng sản phẩm", value: dash ?? totalCount, icon: IconShoppingBag, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-500", valueColor: "" },
    { label: "Đang bán", value: dash ?? activeCount, icon: IconCircleCheck, iconBg: "bg-green-50 dark:bg-green-950", iconColor: "text-green-500", valueColor: "text-green-600" },
    { label: "Bản nháp", value: dash ?? draftCount, icon: IconFileDescription, iconBg: "bg-gray-100 dark:bg-gray-800", iconColor: "text-gray-500", valueColor: "text-gray-500" },
    { label: "Tổng tồn kho", value: dash ?? totalStock.toLocaleString("vi-VN"), icon: IconPackage, iconBg: "bg-orange-50 dark:bg-orange-950", iconColor: "text-orange-500", valueColor: "text-orange-600" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
              <div className={`rounded-lg p-1.5 ${stat.iconBg}`}>
                <stat.icon className={`size-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
