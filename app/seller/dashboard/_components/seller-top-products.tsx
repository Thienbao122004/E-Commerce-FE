"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPriceVND as currency } from "@/lib/formatters"
import type { SellerProduct } from "@/types/seller-dashboard"

type Props = {
  products: SellerProduct[]
  loading: boolean
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="bg-muted size-10 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-1">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-4 w-12 animate-pulse rounded" />
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
    </div>
  )
}

export function SellerTopProducts({ products, loading }: Props) {
  const topProducts = [...products]
    .filter((p) => p.status === 1)
    .sort((a, b) => b.basePrice - a.basePrice)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sản phẩm bán chạy nhất</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-1 divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : topProducts.length > 0 ? (
          <>
            <div className="divide-y">
              {topProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 py-3 px-1"
                >
                  <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        📦
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">
                    {product.name}
                  </span>
                  <span className="w-16 text-center text-sm text-muted-foreground">
                    {product.totalStock ?? 0}
                  </span>
                  <span className="w-28 text-center text-sm font-semibold text-primary">
                    {currency(product.basePrice)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Chưa có sản phẩm nào
          </div>
        )}
      </CardContent>
    </Card>
  )
}
