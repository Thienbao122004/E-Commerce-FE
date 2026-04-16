"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import { getProductById } from "@/services/storefront-products"
import type { StorefrontProduct } from "@/services/storefront-products"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { StorefrontProductCard } from "@/components/common/storefront-product-card"
import { Separator } from "@/components/ui/separator"

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="aspect-square rounded-t-xl bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between mt-2">
          <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const { session, isLoading: authLoading } = useAuth()
  const { favoriteIds, isFavorited, toggle, isLoading: favLoading } = useFavorites()
  const router = useRouter()

  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)

  const favoriteIdsRef = useRef(favoriteIds)
  favoriteIdsRef.current = favoriteIds

  const favoriteIdsKey = useMemo(() => [...favoriteIds].sort().join(","), [favoriteIds])

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      router.push("/login?redirect=/favorites")
    }
  }, [authLoading, session, router])

  const fetchProducts = useCallback(async () => {
    if (favLoading || !session?.user?.id) return
    setLoading(true)
    const ids = Array.from(favoriteIdsRef.current)
    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    try {
      const results = await Promise.allSettled(ids.map((id) => getProductById(id)))
      const loaded: StorefrontProduct[] = results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getProductById>>> =>
          r.status === "fulfilled" && r.value.success && !!r.value.product
        )
        .map((r) => r.value.product!)
      setProducts(loaded)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [favoriteIdsKey, favLoading, session?.user?.id])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Sync: loại bỏ sản phẩm đã bỏ yêu thích khỏi danh sách hiển thị
  const displayProducts = products.filter((p) => isFavorited(p.id))

  if (authLoading || (!session && !authLoading)) return null

  const isPageLoading = favLoading || loading

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      <header>
        <MainStorefrontHeader />
      </header>

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span
              className="size-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <span className="material-symbols-outlined" style={{ color: "#ef4444", fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
            </span>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-main)" }}>
                Sản phẩm yêu thích
              </h1>
              {!isPageLoading && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {displayProducts.length > 0
                    ? `${displayProducts.length} sản phẩm`
                    : "Chưa có sản phẩm nào"}
                </p>
              )}
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--color-primary)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Loading skeleton */}
        {isPageLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isPageLoading && displayProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div
              className="size-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239,68,68,0.08)" }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{ color: "#ef4444", fontVariationSettings: "'FILL' 0" }}
              >
                favorite
              </span>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold" style={{ color: "var(--color-text-main)" }}>
                Chưa có sản phẩm yêu thích
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Nhấn vào biểu tượng ♡ trên sản phẩm để thêm vào danh sách yêu thích
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Khám phá sản phẩm
            </Link>
          </div>
        )}

        {/* Product grid */}
        {!isPageLoading && displayProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                isFavorited={isFavorited(product.id)}
                onToggleFavorite={toggle}
              />
            ))}
          </div>
        )}
      </main>

      <Separator className="bg-gray-200 mt-12" />
      <footer className="py-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2025 EcomViet Marketplace. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-black transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
