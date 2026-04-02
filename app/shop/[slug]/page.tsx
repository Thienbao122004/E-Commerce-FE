"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { ShopProductCard } from "@/components/common/shop-product-card"
import {
  getShopBySlug,
  getShopProducts,
  getShopCategories,
  followShop,
  unfollowShop,
  type ShopPublicDto,
  type ShopCategoryDto,
} from "@/services/storefront-shops"
import type { StorefrontProduct } from "@/services/storefront-products"
import {
  IconLoader2,
  IconStarFilled,
  IconMessage2,
  IconUserPlus,
  IconUserCheck,
  IconPackage,
  IconUsers,
  IconCalendar,
  IconChevronLeft,
  IconChevronDown,
} from "@tabler/icons-react"
import { toast } from "sonner"

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return n.toString()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  if (years > 0) return `${years} Năm Trước`
  const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000))
  if (months > 0) return `${months} Tháng Trước`
  return "Mới tham gia"
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
}

const SORT_OPTIONS = [
  { value: "newest", label: "Mới Nhất" },
  { value: "best_selling", label: "Bán Chạy" },
  { value: "price_asc", label: "Giá Thấp → Cao" },
  { value: "price_desc", label: "Giá Cao → Thấp" },
]

const MAX_VISIBLE_CATS = 4

export default function ShopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { session } = useAuth()
  const token = session?.access_token

  const [shop, setShop] = useState<ShopPublicDto | null>(null)
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [categories, setCategories] = useState<ShopCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showMoreCats, setShowMoreCats] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMoreCats(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getShopBySlug(slug, token)
      .then((res) => {
        if (res.success && res.shop) {
          setShop(res.shop)
          setFollowing(res.shop.isFollowing)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, token])

  useEffect(() => {
    if (!shop) return
    getShopCategories(shop.id).then((res) => {
      if (res.success) setCategories(res.categories)
    }).catch(() => {})
  }, [shop])

  const loadProducts = useCallback(async () => {
    if (!shop) return
    setLoadingProducts(true)
    try {
      const res = await getShopProducts(shop.id, { page, pageSize, sortBy, categoryId: activeCategoryId })
      setProducts(res.products)
      setTotalCount(res.totalCount)
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [shop, page, pageSize, sortBy, activeCategoryId])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleFollow = async () => {
    if (!token || !shop) { router.push("/login"); return }
    setFollowLoading(true)
    try {
      if (following) {
        await unfollowShop(token, shop.id)
        setFollowing(false)
        setShop((p) => p ? { ...p, followerCount: p.followerCount - 1 } : p)
        toast.success("Đã hủy theo dõi")
      } else {
        await followShop(token, shop.id)
        setFollowing(true)
        setShop((p) => p ? { ...p, followerCount: p.followerCount + 1 } : p)
        toast.success("Đã theo dõi shop")
      }
    } catch { toast.error("Có lỗi xảy ra") }
    finally { setFollowLoading(false) }
  }

  const handleChat = () => {
    if (!token || !shop) { router.push("/login"); return }
    window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { shopId: shop.id } }))
  }

  const selectCategory = (catId: number | null) => {
    setActiveCategoryId(catId)
    setPage(1)
    setShowMoreCats(false)
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const visibleCats = categories.slice(0, MAX_VISIBLE_CATS)
  const overflowCats = categories.slice(MAX_VISIBLE_CATS)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8f7f6" }}>
        <IconLoader2 className="size-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#f8f7f6" }}>
        <p className="text-lg font-medium" style={{ color: "#3d2e1f" }}>Không tìm thấy shop</p>
        <button onClick={() => router.push("/")} className="text-orange-600 hover:underline text-sm">← Quay lại trang chủ</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f7f6" }}>
      <MainStorefrontHeader/>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 mt-4">
        <div className="relative rounded overflow-hidden" style={{ backgroundColor: "#fff" }}>
          <div
            className="h-40 md:h-56 w-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative"
            style={shop.coverUrl ? { backgroundImage: `url(${shop.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="relative px-5 md:px-8 pb-5">
            <div className="absolute -top-10 left-5 md:left-8">
              <div className="size-20 md:size-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#f0ebe4" }}>
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="size-full object-cover" />
                ) : (
                  <span className="text-2xl md:text-3xl font-bold" style={{ color: "#b8860b" }}>{shop.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="pt-14 md:pt-16 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#3d2e1f" }}>{shop.name}</h2>
                {shop.description && <p className="text-sm mt-1 max-w-xl line-clamp-2" style={{ color: "#8b7355" }}>{shop.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleFollow} disabled={followLoading} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${following ? "border-2 border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100" : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/25"}`}>
                  {followLoading ? <IconLoader2 className="size-4 animate-spin" /> : following ? <IconUserCheck className="size-4" /> : <IconUserPlus className="size-4" />}
                  {following ? "Đang Theo Dõi" : "Theo Dõi"}
                </button>
                <button onClick={handleChat} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:bg-orange-50" style={{ borderColor: "#e5ded6", color: "#3d2e1f" }}>
                  <IconMessage2 className="size-4" />Chat
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<IconPackage className="size-4" />} label="Sản Phẩm" value={formatNumber(shop.productCount)} />
              <StatCard icon={<IconUsers className="size-4" />} label="Người Theo Dõi" value={formatNumber(shop.followerCount)} />
              <StatCard icon={<IconStarFilled className="size-4 text-amber-500" />} label="Đánh Giá" value={`${shop.averageRating} (${formatNumber(shop.reviewCount)})`} />
              <StatCard icon={<IconCalendar className="size-4" />} label="Tham Gia" value={formatDate(shop.createdAt)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-10 pb-12">
        <div className="flex items-center justify-between px-5 py-3 rounded mb-4 gap-4" style={{ backgroundColor: "#fff" }}>
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <button
              onClick={() => selectCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeCategoryId === null ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm" : "hover:bg-[#f0ebe4]"}`}
              style={activeCategoryId !== null ? { color: "#3d2e1f" } : {}}
            >
              TẤT CẢ SẢN PHẨM
            </button>
            {visibleCats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeCategoryId === cat.id ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm" : "hover:bg-[#f0ebe4]"}`}
                style={activeCategoryId !== cat.id ? { color: "#3d2e1f" } : {}}
              >
                {cat.name}
              </button>
            ))}
            {overflowCats.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setShowMoreCats(!showMoreCats)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[#f0ebe4]"
                  style={{ color: "#8b7355" }}
                >
                  Thêm <IconChevronDown className={`size-3 transition-transform ${showMoreCats ? "rotate-180" : ""}`} />
                </button>
                {showMoreCats && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ borderColor: "#e5ded6" }}>
                    {overflowCats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => selectCategory(cat.id)}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[#f8f7f6] transition-colors flex items-center justify-between ${activeCategoryId === cat.id ? "font-semibold text-orange-600" : ""}`}
                        style={activeCategoryId !== cat.id ? { color: "#3d2e1f" } : {}}
                      >
                        {cat.name}
                        <span className="text-[10px]" style={{ color: "#8b7355" }}>{cat.productCount}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${sortBy === opt.value ? "bg-[#3d2e1f] text-white shadow-sm" : "hover:bg-[#f0ebe4]"}`}
                style={sortBy !== opt.value ? { color: "#8b7355" } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center h-64">
            <IconLoader2 className="size-6 animate-spin text-orange-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: "#8b7355" }}>
            <IconPackage className="size-12 opacity-30" />
            <p className="text-sm">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p} className="contents">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-sm" style={{ color: "#8b7355" }}>...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`size-9 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm" : "hover:bg-[#f0ebe4]"}`}
                        style={p !== page ? { color: "#3d2e1f" } : {}}
                      >{p}</button>
                    </span>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#f8f7f6", border: "1px solid #e5ded6" }}>
      <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: "#fff", color: "#b8860b" }}>{icon}</div>
      <div>
        <p className="text-[11px]" style={{ color: "#8b7355" }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: "#3d2e1f" }}>{value}</p>
      </div>
    </div>
  )
}
