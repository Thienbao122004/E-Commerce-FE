"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProducts, type StorefrontProduct } from "@/services/storefront-products"
import { getCategories, type StorefrontCategory } from "@/services/storefront-categories"
import { useAuth } from "@/contexts/auth-context"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"

const HeaderUser = dynamic(
  () => import("@/components/layout/header-user").then((m) => m.HeaderUser),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

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

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
    badge: "Ưu đãi hôm nay",
    badgeColor: "#ec7f13",
    title: "Sale lớn\ncuối tuần",
    titleHighlight: "Giảm đến 50%",
    desc: "Hàng ngàn sản phẩm chính hãng — giao nhanh toàn quốc",
    cta: "Mua ngay",
    btnColor: "#ec7f13",
    overlay: "rgba(28, 14, 4, 0.58)",
  },
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    badge: "Hàng mới về",
    badgeColor: "#9a734c",
    title: "Thời trang\nthu đông 2025",
    titleHighlight: "Xu hướng mới",
    desc: "Phong cách hiện đại kết hợp nét truyền thống Việt Nam",
    cta: "Khám phá",
    btnColor: "#9a734c",
    overlay: "rgba(20, 12, 6, 0.60)",
  },
  {
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
    badge: "Đặc sản vùng miền",
    badgeColor: "#c47a2b",
    title: "Tinh hoa\nẩm thực Việt",
    titleHighlight: "Giao tận nhà",
    desc: "Cà phê Đà Lạt, đặc sản Hội An, mắm Phú Quốc — chính gốc 100%",
    cta: "Đặt hàng",
    btnColor: "#c47a2b",
    overlay: "rgba(24, 12, 2, 0.55)",
  },
]

const SIDE_BANNERS = [
  {
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
    sub: "Trang trí nhà cửa",
    title: "Đồ thủ\ncông mỹ nghệ",
    overlay: "rgba(28, 14, 4, 0.52)",
  },
  {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    sub: "Voucher giảm 30%",
    title: "Làm đẹp\nchính hãng",
    overlay: "rgba(28, 14, 4, 0.52)",
  },
]

export default function LandingPage() {
  const { session, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [flashProducts, setFlashProducts] = useState<StorefrontProduct[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<StorefrontProduct[]>([])

  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingFlash, setLoadingFlash] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [featuredPage, setFeaturedPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const PAGE_SIZE = 12

  const [search, setSearch] = useState("")
  const [countdown, setCountdown] = useState({ h: 2, m: 14, s: 55 })
  const [heroSlide, setHeroSlide] = useState(0)
  const [flashScroll, setFlashScroll] = useState({ canPrev: false, canNext: true })
  const flashScrollRef = useRef<HTMLDivElement>(null)

  /* ── fetch ── */
  const loadAll = useCallback(async () => {
    setLoadingCats(true)
    setLoadingFlash(true)
    setLoadingFeatured(true)

    const [catsRes, flashRes, featuredRes] = await Promise.allSettled([
      getCategories({ pageSize: 6, level: 1 }),
      getProducts({ pageSize: 12, sortBy: "newest" }),
      getProducts({ pageSize: 12, sortBy: "rating" }),
    ])

    if (catsRes.status === "fulfilled" && catsRes.value.success)
      setCategories(catsRes.value.categories)
    setLoadingCats(false)

    if (flashRes.status === "fulfilled" && flashRes.value.success)
      setFlashProducts(flashRes.value.products)
    setLoadingFlash(false)

    if (featuredRes.status === "fulfilled" && featuredRes.value.success) {
      const { products, totalCount } = featuredRes.value
      setFeaturedProducts(products)
      setHasMore(products.length < totalCount)
    }
    setLoadingFeatured(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleLoadMore = useCallback(async () => {
    if (!session) {
      router.push("/login")
      return
    }
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = featuredPage + 1
      const res = await getProducts({ page: nextPage, pageSize: PAGE_SIZE, sortBy: "rating" })
      if (res.success) {
        setFeaturedProducts((prev) => {
          const merged = [...prev, ...res.products]
          setHasMore(merged.length < res.totalCount)
          return merged
        })
        setFeaturedPage(nextPage)
      }
    } catch { }
    finally { setLoadingMore(false) }
  }, [session, router, loadingMore, hasMore, featuredPage])
  const uniqueFeaturedProducts = useMemo(() => {
    const seen = new Set<string>()
    return featuredProducts.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [featuredProducts])

  const updateFlashScroll = useCallback(() => {
    const el = flashScrollRef.current
    if (!el) return
    setFlashScroll({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    })
  }, [])

  const scrollFlash = (dir: "prev" | "next") => {
    const el = flashScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "next" ? 540 : -540, behavior: "smooth" })
  }

  useEffect(() => {
    const el = flashScrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateFlashScroll, { passive: true })
    updateFlashScroll()
    return () => el.removeEventListener("scroll", updateFlashScroll)
  }, [flashProducts, updateFlashScroll])

  useEffect(() => {
    const t = setInterval(() => setHeroSlide((p) => (p + 1) % HERO_SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

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
            <HeaderUser />
            
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

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-4 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2">
          <div className="relative rounded-xl overflow-hidden" style={{ height: "300px" }}>
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[6000ms]"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    transform: heroSlide === i ? "scale(1.05)" : "scale(1)",
                  }}
                />
                <div className="absolute inset-0" style={{ backgroundColor: slide.overlay }} />
                <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 max-w-md">
                  <span
                    className="self-start px-2.5 py-0.5 rounded text-white text-[11px] font-bold uppercase tracking-wide mb-3"
                    style={{ backgroundColor: slide.badgeColor }}
                  >
                    {slide.badge}
                  </span>
                  <h2 className="text-white font-black text-3xl md:text-4xl leading-tight mb-1 whitespace-pre-line">
                    {slide.title}
                  </h2>
                  <span className="text-lg font-bold mb-2" style={{ color: "#ffd580" }}>
                    {slide.titleHighlight}
                  </span>
                  <p className="text-white/75 text-sm mb-5 leading-relaxed">{slide.desc}</p>
                  <button
                    className="self-start px-5 py-2 rounded-lg text-white font-bold text-sm flex items-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: slide.btnColor }}
                  >
                    {slide.cta}
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setHeroSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <button
              onClick={() => setHeroSlide((p) => (p + 1) % HERO_SLIDES.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${heroSlide === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-2">
            {SIDE_BANNERS.map((b, i) => (
              <a
                key={i}
                href="#"
                className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group block"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${b.image})` }}
                />
                <div className="absolute inset-0" style={{ background: b.overlay }} />
                <div className="relative z-10 h-full flex flex-col justify-end p-4">
                  <span className="text-[11px] font-semibold text-white/75 mb-0.5">{b.sub}</span>
                  <h3 className="font-black text-white text-base leading-tight whitespace-pre-line">{b.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: "category", label: "Đa dạng sản phẩm", sub: "Có hơn 20 loại sản phẩm" },
            { icon: "verified_user", label: "Hàng chính hãng 100%", sub: "Cam kết hoàn tiền" },
            { icon: "replay", label: "Đổi trả dễ dàng", sub: "Trong vòng 7 ngày" },
            { icon: "support_agent", label: "Hỗ trợ 24/7", sub: "Khiếu nại nhanh chóng" },
          ].map((item) => (
            <div
              key={item.icon}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100"
            >
              <span className="material-symbols-outlined text-2xl shrink-0" style={{ color: "var(--color-primary)" }}>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--color-text-main)" }}>{item.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

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

        <section className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(224,122,95,0.2)" }}>
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
                {Array.from({ length: 5 }).map((_, i) => <FlashCardSkeleton key={i} />)}
              </div>
            ) : flashProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-2">bolt</span>
                <p>Chưa có sản phẩm Flash Sale</p>
              </div>
            ) : (
              <div className="relative mx-4">
                <button
                  onClick={() => scrollFlash("prev")}
                  className={`carousel-arrow carousel-arrow--prev carousel-arrow--hint${!flashScroll.canPrev ? " carousel-arrow--hidden" : ""}`}
                  aria-label="Cuộn về trước"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_left</span>
                </button>

                <button
                  onClick={() => scrollFlash("next")}
                  className={`carousel-arrow carousel-arrow--next carousel-arrow--hint${!flashScroll.canNext ? " carousel-arrow--hidden" : ""}`}
                  aria-label="Cuộn tiếp theo"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                </button>

                <div ref={flashScrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x">
                  {flashProducts.map((product, i) => {
                    const discount = FLASH_DISCOUNTS[i % FLASH_DISCOUNTS.length]
                    const originalPrice = Math.round(product.basePrice / (1 - discount / 100))
                    const soldPercents = [75, 40, 90, 20, 60, 55, 35, 80]
                    const soldPercent = soldPercents[i % soldPercents.length]
                    const img = product.imageUrls?.[0]

                    return (
                      <div
                        key={product.id}
                        className="min-w-[240px] md:min-w-[260px] snap-center group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 cursor-pointer"
                        style={{ backgroundColor: "var(--color-background-light)" }}
                      >
                        <div className="absolute top-3 left-3 z-10 text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "#E07A5F" }}>
                          -{discount}%
                        </div>
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          {img ? (
                            <img
                              src={img}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
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
              </div>
            )}
          </div>
        </section>

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
          ) : uniqueFeaturedProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl block mb-3">inventory_2</span>
              <p className="font-medium">Chưa có sản phẩm nào</p>
              <p className="text-sm mt-1">Sản phẩm sẽ xuất hiện ở đây khi người bán đăng tải</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {uniqueFeaturedProducts.map((product, i) => {
                  const img = product.imageUrls?.[0]
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
              {hasMore && (
                <div className="flex flex-col items-center gap-2 mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 font-bold rounded-lg transition-all shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ color: "var(--color-text-main)" }}
                  >
                    {loadingMore ? (
                      <>
                        <span className="size-4 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
                        Đang tải...
                      </>
                    ) : !session ? (
                      <>
                        Đăng nhập để xem thêm
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">expand_more</span>
                        Xem thêm sản phẩm
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </main>

      <Separator className="bg-gray-200 mt-12" />
      <footer className="pt-8 pb-8 mt-auto">
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
                  className="border-gray-400 border rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none placeholder:text-gray-500"
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
              <a href="#" className="hover:text-black transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-black transition-colors">Điều khoản dịch vụ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
