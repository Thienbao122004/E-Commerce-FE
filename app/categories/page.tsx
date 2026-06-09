"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getCategories, type StorefrontCategory } from "@/services/storefront-categories"
import { Separator } from "@/components/ui/separator"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"

const ICON_MAP: Record<string, string> = {
  fashion: "checkroom", thoi_trang: "checkroom",
  food: "restaurant", dac_san: "restaurant",
  coffee: "coffee", ca_phe: "coffee",
  crafts: "palette", thu_cong: "palette",
  beauty: "spa", lam_dep: "spa",
  home: "chair", trang_tri: "chair",
  gift: "card_giftcard", qua: "card_giftcard",
  default: "category",
}

function getCategoryIcon(code: string): string {
  const k = code.toLowerCase().replace(/-/g, "_")
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (k.includes(key)) return icon
  }
  return ICON_MAP.default
}

function CategoryCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white animate-pulse overflow-hidden">
      <div className="aspect-square bg-gray-200" />
      <div className="px-2 py-2.5 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories({ pageSize: 100, level: 1 })
      .then((res) => { if (res.success) setCategories(res.categories) })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      <MainStorefrontHeader />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: "var(--color-text-main)" }}>
            <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
            Tất cả danh mục
          </h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-1 ml-4.5">
              {categories.length} danh mục
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 24 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">category</span>
            <p className="text-lg font-bold text-gray-400">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug || cat.id}`}
                className="group flex flex-col items-center rounded-xl bg-white border border-gray-100 hover:border-[var(--color-primary)] hover:shadow-lg transition-all text-center overflow-hidden"
              >
                {/* Image */}
                <div className="w-full aspect-square overflow-hidden bg-gray-100">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: "#f5ede0", color: "var(--color-text-secondary)" }}
                    >
                      <span className="material-symbols-outlined text-4xl">{getCategoryIcon(cat.code)}</span>
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="px-2 py-2.5 w-full">
                  <h2 className="font-bold text-xs truncate" style={{ color: "var(--color-text-main)" }}>
                    {cat.name}
                  </h2>
                  {cat.productCount > 0 && (
                    <span className="text-[11px] text-gray-400">{cat.productCount} sản phẩm</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Separator className="bg-gray-200 mt-12" />
      <footer className="py-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
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
