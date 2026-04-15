import Link from "next/link"
import { formatPriceVND, formatSoldCount } from "@/lib/formatters"
import type { StorefrontProduct } from "@/services/storefront-products"

type StorefrontProductCardProps = {
  product: StorefrontProduct
  isFavorited: boolean
  onToggleFavorite: (productId: string) => void
}

export function StorefrontProductCard({
  product,
  isFavorited,
  onToggleFavorite,
}: StorefrontProductCardProps) {
  const img = product.imageUrls?.[0]

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-[rgba(236,127,19,0.5)] hover:shadow-md transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 shrink-0">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-gray-300">image</span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite(product.id)
          }}
          className="absolute top-2 right-2 size-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          style={{
            backgroundColor: isFavorited ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.85)",
            color: isFavorited ? "#ef4444" : "#9ca3af",
          }}
          aria-label={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm mb-1 truncate" style={{ color: "var(--color-text-main)" }}>
          {product.name}
        </h3>
        <div className="mt-auto pt-3 flex items-end justify-between gap-1">
          <span className="font-bold text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {formatPriceVND(product.basePrice)}
          </span>
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
