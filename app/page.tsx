"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProducts, type StorefrontProduct } from "@/services/storefront-products"
import { getCategories, type StorefrontCategory } from "@/services/storefront-categories"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import { Separator } from "@/components/ui/separator"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { StorefrontFooter } from "@/components/layout/storefront-footer"
import { StorefrontProductCard } from "@/components/common/storefront-product-card"
import { formatPriceVND as formatPrice } from "@/lib/formatters"

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

type CategoryPreset = {
  badgeColor: string
  btnColor: string
  region: string
  regionIcon: string
  highlight: string
  desc: string
  fallbackImage: string
  overlayDark: string
  cta: string
}

const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  food: {
    badgeColor: "#b85c1a",
    btnColor: "#b85c1a",
    region: "Đặc sản 63 tỉnh thành",
    regionIcon: "pin_drop",
    highlight: "100% chính gốc địa phương",
    desc: "Đặc sản tươi ngon từ tay người làng, người bản — giao tận nhà trên toàn quốc.",
    fallbackImage: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(18,8,2,0.80) 40%, rgba(18,8,2,0.20) 100%)",
    cta: "Khám phá ngay",
  },
  thu_cong: {
    badgeColor: "#6b4226",
    btnColor: "#6b4226",
    region: "Hội An · Bát Tràng · Vạn Phúc",
    regionIcon: "handyman",
    highlight: "Từ tay nghệ nhân làng nghề",
    desc: "Sản phẩm độc bản, mang đậm hồn cốt văn hóa — mỗi chiếc là câu chuyện của người thợ lành nghề.",
    fallbackImage: "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(14,6,2,0.82) 40%, rgba(14,6,2,0.18) 100%)",
    cta: "Xem bộ sưu tập",
  },
  ca_phe: {
    badgeColor: "#2d5a27",
    btnColor: "#2d5a27",
    region: "Tây Nguyên · Sơn La · Cầu Đất",
    regionIcon: "grass",
    highlight: "Đặc sản thuần Việt",
    desc: "Hương vị thượng hạng từ vùng đất trồng cà phê nổi tiếng — rang xay thủ công, không pha trộn.",
    fallbackImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(10,14,6,0.82) 40%, rgba(10,14,6,0.18) 100%)",
    cta: "Đặt hàng",
  },
  thoi_trang: {
    badgeColor: "#a13f5d",
    btnColor: "#a13f5d",
    region: "Thương hiệu thuần Việt",
    regionIcon: "checkroom",
    highlight: "Phong cách Việt đương đại",
    desc: "Cảm hứng từ truyền thống, kết tinh trong từng đường may — tôn vinh vẻ đẹp người Việt.",
    fallbackImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(20,6,12,0.80) 40%, rgba(20,6,12,0.18) 100%)",
    cta: "Mua ngay",
  },
  sac_dep: {
    badgeColor: "#7c5530",
    btnColor: "#7c5530",
    region: "Thảo dược bản địa",
    regionIcon: "spa",
    highlight: "Lành tính · Thiên nhiên",
    desc: "Mỹ phẩm thuần tự nhiên, công thức truyền thống kết hợp công nghệ hiện đại của thương hiệu Việt.",
    fallbackImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(14,8,2,0.78) 40%, rgba(14,8,2,0.18) 100%)",
    cta: "Khám phá",
  },
  trang_tri: {
    badgeColor: "#5a6f3a",
    btnColor: "#5a6f3a",
    region: "Nội thất thủ công Việt",
    regionIcon: "chair",
    highlight: "Không gian sống Việt",
    desc: "Đồ trang trí, nội thất mang đậm phong cách Á Đông — tinh tế trong từng chi tiết nhỏ.",
    fallbackImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(12,14,6,0.80) 40%, rgba(12,14,6,0.18) 100%)",
    cta: "Khám phá",
  },
  qua: {
    badgeColor: "#9a3a3a",
    btnColor: "#9a3a3a",
    region: "Quà tặng đặc trưng vùng miền",
    regionIcon: "card_giftcard",
    highlight: "Trao gửi tinh hoa Việt",
    desc: "Hộp quà ý nghĩa, đóng gói cẩn thận — món quà mang đậm bản sắc dành cho người thân.",
    fallbackImage: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80",
    overlayDark: "linear-gradient(100deg, rgba(20,6,6,0.78) 40%, rgba(20,6,6,0.18) 100%)",
    cta: "Chọn quà",
  },
}

const DEFAULT_CATEGORY_PRESET: CategoryPreset = {
  badgeColor: "#b85c1a",
  btnColor: "#b85c1a",
  region: "Thương hiệu Việt",
  regionIcon: "storefront",
  highlight: "Sản phẩm địa phương đặc sắc",
  desc: "Khám phá những thương hiệu địa phương Việt Nam — chất lượng, chính gốc, giao tận nhà.",
  fallbackImage: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80",
  overlayDark: "linear-gradient(100deg, rgba(18,8,2,0.80) 40%, rgba(18,8,2,0.20) 100%)",
  cta: "Xem ngay",
}

function getCategoryPreset(code: string): CategoryPreset {
  const k = code.toLowerCase().replace(/-/g, "_")
  for (const [key, preset] of Object.entries(CATEGORY_PRESETS)) {
    if (k.includes(key)) return preset
  }
  return DEFAULT_CATEGORY_PRESET
}

const SIDE_BANNER_OVERLAY = "linear-gradient(to top, rgba(14,7,2,0.82) 45%, rgba(14,7,2,0.10) 100%)"

export default function LandingPage() {
  const { session, isLoading: authLoading, role } = useAuth()
  const { isFavorited, toggle: toggleFavorite } = useFavorites()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else if (role === 'seller') {
      window.location.href = '/seller/dashboard'
    }
  }, [authLoading, role])

  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [flashProducts, setFlashProducts] = useState<StorefrontProduct[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<StorefrontProduct[]>([])

  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingFlash, setLoadingFlash] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [featuredPage, setFeaturedPage] = useState(1)
  const [totalFeaturedCount, setTotalFeaturedCount] = useState(0)

  const PAGE_SIZE = 12

  const [countdown, setCountdown] = useState({ h: 2, m: 14, s: 55 })
  const [heroSlide, setHeroSlide] = useState(0)
  const [flashScroll, setFlashScroll] = useState({ canPrev: false, canNext: true })
  const flashScrollRef = useRef<HTMLDivElement>(null)

  const loadAll = useCallback(async () => {
    setLoadingCats(true)
    setLoadingFlash(true)
    setLoadingFeatured(true)

    const [catsRes, flashRes, featuredRes] = await Promise.allSettled([
      getCategories({ pageSize: 6, level: 1 }),
      getProducts({ pageSize: 12, sortBy: "best_seller" }),
      getProducts({ pageSize: 12, sortBy: "newest" }),
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
      setTotalFeaturedCount(totalCount)
    }
    setLoadingFeatured(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const uniqueFeaturedProducts = useMemo(() => {
    const seen = new Set<string>()
    return featuredProducts.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [featuredProducts])

  // Sort all categories by productCount desc — use all regardless of count
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => b.productCount - a.productCount),
    [categories]
  )

  // Hero: top 3 categories
  const heroSlides = useMemo(() => {
    return sortedCategories.slice(0, 3).map((cat) => {
      const preset = getCategoryPreset(cat.code)
      return {
        id: cat.id,
        image: cat.image || preset.fallbackImage,
        badge: cat.name,
        badgeColor: preset.badgeColor,
        title: `Tinh hoa\n${cat.name}`,
        titleHighlight: preset.highlight,
        desc: preset.desc,
        cta: preset.cta,
        btnColor: preset.btnColor,
        overlay: preset.overlayDark,
        region: preset.region,
        regionIcon: preset.regionIcon,
        productCount: cat.productCount,
        link: `/search?category=${cat.slug}`,
      }
    })
  }, [sortedCategories])

  // Side banners: next 2 categories after hero (index 3-4)
  // If not enough, wrap around from the beginning (different from hero)
  const sideBanners = useMemo(() => {
    if (sortedCategories.length === 0) return []
    const picks = sortedCategories.length >= 5
      ? sortedCategories.slice(3, 5)
      : sortedCategories.slice(0, 2)
    return picks.map((cat) => {
      const preset = getCategoryPreset(cat.code)
      return {
        id: cat.id,
        image: cat.image || preset.fallbackImage,
        sub: preset.region,
        title: cat.name,
        productCount: cat.productCount,
        overlay: SIDE_BANNER_OVERLAY,
        link: `/search?category=${cat.slug}`,
      }
    })
  }, [sortedCategories])

  const hasMore = uniqueFeaturedProducts.length < totalFeaturedCount

  const handleLoadMore = useCallback(async () => {
    if (!session) {
      router.push("/login")
      return
    }
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = featuredPage + 1
      const res = await getProducts({ page: nextPage, pageSize: PAGE_SIZE, sortBy: "newest" })
      if (res.success) {
        setFeaturedProducts((prev) => [...prev, ...res.products])
        setTotalFeaturedCount(res.totalCount)
        setFeaturedPage(nextPage)
      }
    } catch { }
    finally { setLoadingMore(false) }
  }, [session, router, loadingMore, hasMore, featuredPage])

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
    if (heroSlides.length <= 1) return
    setHeroSlide((p) => (p >= heroSlides.length ? 0 : p))
    const t = setInterval(() => setHeroSlide((p) => (p + 1) % heroSlides.length), 4500)
    return () => clearInterval(t)
  }, [heroSlides.length])

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

  if (authLoading || role === 'admin' || role === 'seller') return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      <header>
        <MainStorefrontHeader />
      </header>

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-4 space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
            Nền tảng thương hiệu địa phương Việt Nam
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "#e5ded6" }} />
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>verified</span>Chính gốc
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>eco</span>Thuần Việt
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>local_shipping</span>Toàn quốc
            </span>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-2">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-stone-200 to-stone-300" style={{ height: "360px" }}>
            {loadingCats || heroSlides.length === 0 ? (
              <div className="absolute inset-0 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-300 via-stone-200 to-stone-300" />
                <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 max-w-[420px] gap-3">
                  <div className="h-5 w-28 bg-white/40 rounded-md" />
                  <div className="h-9 w-72 bg-white/40 rounded" />
                  <div className="h-9 w-56 bg-white/40 rounded" />
                  <div className="h-4 w-64 bg-white/30 rounded mt-1" />
                  <div className="h-10 w-36 bg-white/40 rounded-lg mt-2" />
                </div>
              </div>
            ) : (
              <>
                {heroSlides.map((slide, i) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms]"
                      style={{
                        backgroundImage: `url(${slide.image})`,
                        transform: heroSlide === i ? "scale(1.06)" : "scale(1)",
                      }}
                    />
                    <div className="absolute inset-0" style={{ background: slide.overlay }} />

                    <div className="relative z-10 h-full flex flex-col justify-center px-20 py-6 max-w-[600px]">
                      <span
                        className="self-start px-2.5 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-widest mb-3"
                        style={{ backgroundColor: slide.badgeColor }}
                      >
                        {slide.badge}
                      </span>

                      <h2 className="text-white font-black text-[2.1rem] md:text-[2.5rem] leading-[1.15] mb-1.5 whitespace-pre-line drop-shadow-md">
                        {slide.title}
                      </h2>
                      <span className="text-base font-bold mb-3 drop-shadow" style={{ color: "#ffd580" }}>
                        {slide.titleHighlight}
                      </span>
                      <p className="text-white/70 text-sm mb-5 leading-relaxed max-w-[320px]">{slide.desc}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={slide.link}
                          className="px-5 py-2 rounded-lg text-white font-bold text-sm flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
                          style={{ backgroundColor: slide.btnColor }}
                        >
                          {slide.cta}
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
                        </Link>

                        <span className="flex items-center gap-1 text-white/60 text-[11px] font-medium">
                          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>{slide.regionIcon}</span>
                          {slide.region}
                        </span>

                        {slide.productCount > 0 && (
                          <span className="text-white/50 text-[11px] font-medium border-l border-white/20 pl-3">
                            {slide.productCount.toLocaleString("vi-VN")} sản phẩm
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20 text-white/40 text-xs font-mono font-bold tabular-nums select-none">
                      {String(i + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
                    </div>
                  </div>
                ))}

                {heroSlides.length > 1 && (
                  <>
                    <button
                      onClick={() => setHeroSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_left</span>
                    </button>
                    <button
                      onClick={() => setHeroSlide((p) => (p + 1) % heroSlides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_right</span>
                    </button>

                    <div className="absolute bottom-4 left-8 z-20 flex items-center gap-2">
                      {heroSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setHeroSlide(i)}
                          className={`rounded-full transition-all duration-300 ${heroSlide === i ? "w-7 h-2 bg-white" : "size-2 bg-white/40 hover:bg-white/65"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-2">
            {loadingCats || sideBanners.length === 0
              ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="relative flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-stone-200 to-stone-300 animate-pulse" />
              ))
              : sideBanners.map((b) => (
                <Link
                  key={b.id}
                  href={b.link}
                  className="relative flex-1 rounded-2xl overflow-hidden cursor-pointer group block"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-107"
                    style={{ backgroundImage: `url(${b.image})` }}
                  />
                  <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80" style={{ background: b.overlay }} />
                  <div className="relative z-10 h-full flex flex-col justify-end p-4">
                    <span
                      className="self-start px-2 py-0.5 rounded text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ backgroundColor: "rgba(0,0,0,0.30)" }}
                    >
                      {b.sub}
                    </span>
                    <h3 className="font-black text-white text-[0.95rem] leading-snug whitespace-pre-line drop-shadow">{b.title}</h3>
                    <span className="mt-2 text-white/60 text-[11px] flex items-center gap-0.5 font-medium group-hover:text-white/90 transition-colors">
                      Xem ngay
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>arrow_forward</span>
                    </span>
                  </div>
                </Link>
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
            <Link href="/categories" className="font-bold text-sm hover:underline flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
              Xem tất cả
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
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
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug || cat.id}`}
                  className="group flex flex-col items-center rounded-xl bg-white border border-gray-100 hover:border-[var(--color-primary)] hover:shadow-lg transition-all text-center overflow-hidden"
                >
                  <div className="w-full aspect-square overflow-hidden bg-gray-100 relative">
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
                  <div className="px-2 py-2.5 w-full">
                    <h3 className="font-bold text-xs truncate" style={{ color: "var(--color-text-main)" }}>{cat.name}</h3>
                    {cat.productCount > 0 && (
                      <span className="text-[11px] text-gray-400">{cat.productCount} sản phẩm</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(236,127,19,0.2)" }}>
          <div
            className="border-b px-6 py-4 flex items-center justify-between gap-4"
            style={{ backgroundColor: "rgba(236,127,19,0.06)", borderColor: "rgba(236,127,19,0.1)" }}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text-secondary)" }}>
                Sản phẩm nổi bật
              </h2>
              <span className="hidden md:block h-6 w-px mx-2" style={{ backgroundColor: "rgba(236,127,19,0.3)" }} />
              <span className="text-sm font-semibold text-gray-500">Được mua nhiều nhất</span>
            </div>
            <Link href="/search" className="text-sm font-bold flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
              Xem tất cả
              <span className="material-symbols-outlined text-sm hover:underline">chevron_right</span>
            </Link>
          </div>

          <div className="p-6">
            {loadingFlash ? (
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 5 }).map((_, i) => <FlashCardSkeleton key={i} />)}
              </div>
            ) : flashProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-2">star</span>
                <p>Chưa có sản phẩm nổi bật</p>
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
                  {flashProducts.map((product) => {
                    const img = product.imageUrls?.[0]

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug || product.id}`}
                        className="min-w-[240px] md:min-w-[260px] snap-center group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[rgba(236,127,19,0.4)]"
                        style={{ backgroundColor: "var(--color-background-light)" }}
                      >
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
                          <h3 className="font-bold truncate min-h-[48px] text-sm" style={{ color: "var(--color-text-main)" }}>
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-lg font-bold" style={{ color: "var(--color-text-secondary)" }}>
                              {formatPrice(product.basePrice)}
                            </span>
                            <button
                              onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
                              className="size-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                              style={{
                                backgroundColor: isFavorited(product.id) ? "rgba(239,68,68,0.1)" : "rgba(0,0,0,0.04)",
                                color: isFavorited(product.id) ? "#ef4444" : "#9ca3af",
                              }}
                              aria-label={isFavorited(product.id) ? "Bỏ yêu thích" : "Yêu thích"}
                            >
                              <span
                                className="material-symbols-outlined text-xl"
                                style={{ fontVariationSettings: isFavorited(product.id) ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                favorite
                              </span>
                            </button>
                          </div>
                          {product.soldCount > 0 && (
                            <span className="text-[10px] font-semibold text-gray-400">
                              Đã bán{" "}
                              <span className="font-bold" style={{ color: "var(--color-text-secondary)" }}>
                                {product.soldCount >= 1000
                                  ? `${(product.soldCount / 1000).toFixed(1)}k`
                                  : product.soldCount}
                              </span>
                            </span>
                          )}
                        </div>
                      </Link>
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
              Tất cả sản phẩm
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
                {uniqueFeaturedProducts.map((product) => (
                  <StorefrontProductCard
                    key={product.id}
                    product={product}
                    isFavorited={isFavorited(product.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
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
      <StorefrontFooter />
    </div>
  )
}
