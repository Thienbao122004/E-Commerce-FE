"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getProducts, type StorefrontProduct } from "@/services/storefront-products"
import { getCategories, type StorefrontCategory } from "@/services/storefront-categories"

/* ─────────────────── helpers ─────────────────── */

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price)
}


/* ─────────────────── icon map ─────────────────── */

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

/* ─────────────── skeleton ─────────────── */

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white border border-gray-100 animate-pulse">
      <div className="size-14 rounded-full bg-gray-200" />
      <div className="h-3 w-16 bg-gray-200 rounded" />
    </div>
  )
}

function FlashCardSkeleton() {
  return (
    <div className="min-w-[240px] rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between mt-2">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="size-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  )
}

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
          <div className="size-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}


const FLASH_DISCOUNTS = [30, 15, 25, 20, 40, 35, 10, 45, 18, 28]

export default function LandingPage() {
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [flashProducts, setFlashProducts] = useState<StorefrontProduct[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<StorefrontProduct[]>([])

  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingFlash, setLoadingFlash] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  const [search, setSearch] = useState("")
  const [countdown, setCountdown] = useState({ h: 2, m: 14, s: 55 })

  /* ── fetch ── */
  const loadCategories = useCallback(async () => {
    setLoadingCats(true)
    try {
      const res = await getCategories({ pageSize: 6, level: 1 })
      if (res.success) setCategories(res.categories)
    } catch { /* silent */ }
    finally { setLoadingCats(false) }
  }, [])

  const loadFlash = useCallback(async () => {
    setLoadingFlash(true)
    try {
      const res = await getProducts({ pageSize: 12, sortBy: "newest" })
      if (res.success) setFlashProducts(res.products)
    } catch { /* silent */ }
    finally { setLoadingFlash(false) }
  }, [])

  const loadFeatured = useCallback(async () => {
    setLoadingFeatured(true)
    try {
      const res = await getProducts({ pageSize: 12, sortBy: "rating" })
      if (res.success) setFeaturedProducts(res.products)
    } catch { /* silent */ }
    finally { setLoadingFeatured(false) }
  }, [])

  useEffect(() => {
    loadCategories()
    loadFlash()
    loadFeatured()
  }, [loadCategories, loadFlash, loadFeatured])

  /* ── countdown ── */
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p.s > 0) return { ...p, s: p.s - 1 }
        if (p.m > 0) return { ...p, m: p.m - 1, s: 59 }
        if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 }
        return p
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
        style={{ backgroundColor: "rgba(248,247,246,0.96)", borderColor: "#e5ded6" }}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-primary)" }}>
              local_florist
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-main)" }}>
              EcomViet
            </h1>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div
              className="flex w-full items-center rounded-lg overflow-hidden border border-transparent transition-colors focus-within:border-[var(--color-primary)]"
              style={{ backgroundColor: "#f0ebe4" }}
            >
              <div className="flex items-center pl-3" style={{ color: "var(--color-text-secondary)" }}>
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, shop, thương hiệu..."
                className="w-full bg-transparent border-none py-2.5 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400"
                style={{ color: "var(--color-text-main)" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href="/login"
              className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4]"
              style={{ color: "var(--color-text-main)" }}
            >
              <span className="material-symbols-outlined">person</span>
            </Link>
            <button
              className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4] relative"
              style={{ color: "var(--color-text-main)" }}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 rounded-full" style={{ backgroundColor: "#E07A5F" }} />
            </button>
            <button
              className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4]"
              style={{ color: "var(--color-text-main)" }}
            >
              <span className="material-symbols-outlined">shopping_cart</span>
            </button>
          </div>
        </div>

        <nav className="border-t bg-white" style={{ borderColor: "#e5ded6" }}>
          <div className="max-w-[1440px] mx-auto px-10">
            <ul className="flex items-center gap-8 py-3 overflow-x-auto no-scrollbar">
              <li>
                <a href="#" className="text-sm font-bold whitespace-nowrap" style={{ color: "var(--color-primary)" }}>
                  Trang chủ
                </a>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <a
                    href="#"
                    className="text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--color-primary)]"
                    style={{ color: "var(--color-text-main)" }}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ══ MAIN ══ */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 space-y-12">
        <section className="rounded-2xl overflow-hidden relative min-h-[400px] md:min-h-[500px] flex items-center group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1400&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 p-6 md:p-16 max-w-2xl flex flex-col gap-6 items-start">
            <span
              className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold tracking-wider uppercase"
              style={{ backgroundColor: "rgba(236,127,19,0.9)" }}
            >
              Hàng thủ công tuyển chọn
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
              Khám phá<br />
              <span style={{ color: "var(--color-primary)" }}>Tinh hoa Việt Nam</span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl font-medium max-w-lg">
              Hàng thủ công chất lượng giao tận nhà. Từ lụa Hội An đến gốm Bát Tràng — hỗ trợ trực tiếp nghệ nhân địa phương.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <button
                className="h-12 px-8 rounded-lg text-white font-bold text-base transition-all flex items-center gap-2 shadow-lg"
                style={{ backgroundColor: "var(--color-text-secondary)" }}
              >
                Xem bộ sưu tập
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button className="h-12 px-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-all border border-white/30 backdrop-blur-sm">
                Xem người bán
              </button>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
            <div className="w-2 h-1 bg-white/50 rounded-full" />
            <div className="w-2 h-1 bg-white/50 rounded-full" />
          </div>
        </section>

        {/* ── Categories ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Danh mục nổi bật
            </h2>
            <a href="#" className="font-bold text-sm hover:underline flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
              Xem tất cả
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </a>
          </div>

          {loadingCats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <span className="material-symbols-outlined text-4xl block mb-2">category</span>
              <p>Chưa có danh mục nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href="#"
                  className="group flex flex-col items-center gap-2 p-6 rounded-xl bg-white border border-gray-100 hover:border-[var(--color-primary)] hover:shadow-lg transition-all text-center"
                >
                  <div
                    className="size-14 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: "#f5ede0", color: "var(--color-text-secondary)" }}
                  >
                    <span className="material-symbols-outlined text-3xl">{getCategoryIcon(cat.code)}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--color-text-main)" }}>{cat.name}</h3>
                  {cat.productCount > 0 && (
                    <span className="text-xs text-gray-400">{cat.productCount} sản phẩm</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ── Flash Sale ── */}
        <section className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "rgba(224,122,95,0.2)" }}>
          <div
            className="border-b px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{ backgroundColor: "rgba(224,122,95,0.08)", borderColor: "rgba(224,122,95,0.1)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg text-white" style={{ backgroundColor: "#E07A5F" }}>
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: "#E07A5F" }}>
                Flash Sale
              </h2>
              <span className="hidden md:block h-6 w-px mx-2" style={{ backgroundColor: "rgba(224,122,95,0.3)" }} />
              <span className="text-sm font-semibold text-gray-500">Ưu đãi hôm nay</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kết thúc sau</span>
              <div className="flex gap-1 text-white font-bold">
                {[countdown.h, countdown.m, countdown.s].map((unit, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="rounded px-2 py-1 min-w-[36px] text-center text-sm" style={{ backgroundColor: "#E07A5F" }}>
                      {pad(unit)}
                    </span>
                    {i < 2 && <span className="text-sm" style={{ color: "#E07A5F" }}>:</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingFlash ? (
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 4 }).map((_, i) => <FlashCardSkeleton key={i} />)}
              </div>
            ) : flashProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-2">bolt</span>
                <p>Chưa có sản phẩm Flash Sale</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x">
                {flashProducts.map((product, i) => {
                  const discount = FLASH_DISCOUNTS[i % FLASH_DISCOUNTS.length]
                  const originalPrice = Math.round(product.basePrice / (1 - discount / 100))
                  const soldPercents = [75, 40, 90, 20, 60, 55, 35, 80]
                  const soldPercent = soldPercents[i % soldPercents.length]
                  const img = product.imageUrls?.[0]

                  return (
                    <div
                      key={product.id}
                      className="min-w-[240px] md:min-w-[260px] snap-center group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                      style={{ backgroundColor: "var(--color-background-light)" }}
                    >
                      <div className="absolute top-3 left-3 z-10 text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "#E07A5F" }}>
                        -{discount}%
                      </div>
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <span
                          className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: "rgba(236,127,19,0.15)", color: "var(--color-text-secondary)" }}
                        >
                          {product.shopName}
                        </span>
                        <h3 className="font-bold line-clamp-2 min-h-[48px] text-sm" style={{ color: "var(--color-text-main)" }}>
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                            <span className="text-lg font-bold" style={{ color: "#E07A5F" }}>
                              {formatPrice(product.basePrice)}
                            </span>
                          </div>
                          <button
                            className="size-10 rounded-full text-white flex items-center justify-center shadow-md transition-colors"
                            style={{ backgroundColor: "var(--color-text-secondary)" }}
                          >
                            <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                          </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${soldPercent}%`, backgroundColor: "#E07A5F" }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: "#E07A5F" }}>
                          {soldPercent >= 90 ? "Sắp hết hàng" : "Đang bán chạy"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

          {/* ── Featured Products ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--color-text-secondary)" }} />
              Sản phẩm nổi bật
            </h2>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl block mb-3">inventory_2</span>
              <p className="font-medium">Chưa có sản phẩm nào</p>
              <p className="text-sm mt-1">Sản phẩm sẽ xuất hiện ở đây khi người bán đăng tải</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {featuredProducts.map((product, i) => {
                  const img = product.imageUrls?.[0]
                  const tagColors = [
                    "bg-green-100 text-green-800", "bg-purple-100 text-purple-800",
                    "bg-amber-100 text-amber-800", "bg-orange-100 text-orange-800",
                    "bg-blue-100 text-blue-800", "bg-pink-100 text-pink-800",
                    "bg-teal-100 text-teal-800", "bg-rose-100 text-rose-800",
                  ][i % 8]
                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-[rgba(236,127,19,0.5)] transition-all duration-300"
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
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${tagColors}`}>
                            {product.categoryName || product.shopName}
                          </span>
                        </div>
                        <h3 className="text-sm mb-1 line-clamp-2" style={{ color: "var(--color-text-main)" }}>
                          {product.name}
                        </h3>
                        <div className="mt-auto pt-3">
                          <span className="font-bold text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {formatPrice(product.basePrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center mt-10">
                <button
                  className="px-8 py-3 bg-white border border-gray-200 font-bold rounded-lg transition-all shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  style={{ color: "var(--color-text-main)" }}
                >
                  Xem thêm sản phẩm
                </button>
              </div>
            </>
          )}
        </section>

        {/* ── Trust indicators ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-gray-100">
          {[
            { icon: "verified", title: "Thương hiệu địa phương xác thực", desc: "Trực tiếp từ nghệ nhân Việt Nam" },
            { icon: "local_shipping", title: "Giao hàng toàn quốc", desc: "Vận chuyển nhanh đến 63 tỉnh thành" },
            { icon: "lock", title: "Thanh toán bảo mật", desc: "Momo, ZaloPay & thẻ ngân hàng" },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-dashed border-gray-200">
              <div
                className="size-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(236,127,19,0.1)", color: "var(--color-primary)" }}
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div>
                <h4 className="font-bold" style={{ color: "var(--color-text-main)" }}>{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="pt-16 pb-8 mt-auto text-white" style={{ backgroundColor: "var(--color-surface-dark)" }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl" style={{ color: "var(--color-primary)" }}>local_florist</span>
                <h2 className="text-2xl font-bold">EcomViet</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Kết nối bạn với trái tim Việt Nam. Khám phá hàng thủ công xác thực, thời trang và đặc sản từ khắp mọi miền đất nước.
              </p>
            </div>
            {[
              { title: "Mua sắm", links: ["Thời trang & Lụa", "Trang trí nhà", "Cà phê đặc sản", "Thực phẩm khô", "Flash Sales"] },
              { title: "Hỗ trợ khách hàng", links: ["Trung tâm trợ giúp", "Chính sách giao hàng", "Đổi trả & hoàn tiền", "Trở thành người bán", "Liên hệ chúng tôi"] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-bold text-lg mb-4">{col.title}</h3>
                <ul className="flex flex-col gap-2 text-sm text-gray-400">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="hover:text-[var(--color-primary)] transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="font-bold text-lg mb-4">Cập nhật mới nhất</h3>
              <p className="text-gray-400 text-sm mb-4">Đăng ký nhận thông tin về sản phẩm mới và ưu đãi độc quyền.</p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Địa chỉ email của bạn"
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none placeholder:text-gray-500"
                />
                <button className="text-white font-bold py-3 px-4 rounded-lg transition-colors" style={{ backgroundColor: "var(--color-primary)" }}>
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <p>© 2025 EcomViet Marketplace. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
