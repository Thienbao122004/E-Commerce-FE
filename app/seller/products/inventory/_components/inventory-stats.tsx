"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { SellerProduct } from "@/types/seller-dashboard"

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

type Props = {
  products: SellerProduct[]
  loading: boolean
}

export function InventoryStats({ products, loading }: Props) {
  const totalProducts = products.length
  const inventoryValue = products.reduce((sum, p) => sum + p.basePrice * (p.totalStock ?? 0), 0)
  const lowStock = products.filter((p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= 10).length
  const outOfStock = products.filter((p) => (p.totalStock ?? 0) === 0).length
  const dash = loading ? "—" : undefined

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs font-medium">Tổng sản phẩm</p>
          <p className="text-2xl font-bold tabular-nums">{dash ?? totalProducts.toLocaleString("vi-VN")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs font-medium">Giá trị kho</p>
          <p className="text-2xl font-bold tabular-nums">{dash ?? currency(inventoryValue)}</p>
        </CardContent>
      </Card>
      <Card className={lowStock > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
        <CardContent className="p-4">
          <p className="text-orange-600 text-xs font-medium">Sắp hết hàng</p>
          <p className="text-2xl font-bold tabular-nums text-orange-600">{dash ?? lowStock}</p>
          <p className="text-xs text-muted-foreground">Cần nhập thêm</p>
        </CardContent>
      </Card>
      <Card className={outOfStock > 0 ? "border-red-200 dark:border-red-800" : ""}>
        <CardContent className="p-4">
          <p className="text-red-600 text-xs font-medium">Hết hàng</p>
          <p className="text-2xl font-bold tabular-nums text-red-600">{dash ?? outOfStock}</p>
        </CardContent>
      </Card>
    </div>
  )
}
