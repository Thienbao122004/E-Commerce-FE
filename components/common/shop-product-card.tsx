import Link from "next/link"
import { IconShoppingCart } from "@tabler/icons-react"
import { formatPriceVND, formatSoldCount } from "@/lib/formatters"
import type { StorefrontProduct } from "@/services/storefront-products"

type ShopProductCardProps = {
  product: StorefrontProduct
}

export function ShopProductCard({ product }: ShopProductCardProps) {
  const img = product.imageUrls?.[0]

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-[rgba(236,127,19,0.5)] hover:shadow-md transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 shrink-0">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
        ) : (
          <div className="size-full flex items-center justify-center">
            <IconShoppingCart className="size-10 opacity-20" style={{ color: "#8b7355" }} />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm mb-1 line-clamp-2" style={{ color: "#3d2e1f" }}>
          {product.name}
        </p>
        <div className="mt-auto pt-3 flex items-end justify-between gap-1">
          <p className="font-bold text-sm text-orange-600">{formatPriceVND(product.basePrice)}</p>
          {product.soldCount > 0 && (
            <span className="text-[12px] text-gray-400 shrink-0">
              Đã bán {formatSoldCount(product.soldCount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
