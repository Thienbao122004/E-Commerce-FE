"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  getProductById,
  getProducts,
  type StorefrontProductDetail,
  type StorefrontProduct,
  type ProductVariantStorefront,
} from "@/services/storefront-products"
import { useFavorites } from "@/contexts/favorites-context"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"

const HeaderUser = dynamic(
  () => import("@/components/layout/header-user").then((m) => m.HeaderUser),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

/* ─────────── helpers ─────────── */

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price)
}

function formatSold(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/* ─────────── star rating ─────────── */

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return "full"
    if (i < rating) return "half"
    return "empty"
  })
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {stars.map((type, i) => (
          <span
            key={i}
            className="material-symbols-outlined select-none"
            style={{
              fontSize: "18px",
              color: type === "empty" ? "#d1d5db" : "#f59e0b",
              fontVariationSettings: type === "full" ? "'FILL' 1" : type === "half" ? "'FILL' 0" : "'FILL' 0",
            }}
          >
            {type === "half" ? "star_half" : "star"}
          </span>
        ))}
      </div>
      {rating > 0 && <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>{rating.toFixed(1)}</span>}
      {count > 0 && <span className="text-sm text-gray-400">{count.toLocaleString("vi-VN")} đánh giá</span>}
    </div>
  )
}

/* ─────────── skeletons ─────────── */

function DetailSkeleton() {
  return (
    <div className="grid lg:grid-cols-[2fr_3fr] gap-8 animate-pulse">
      <div>
        <div className="aspect-square rounded-2xl bg-gray-200 mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="size-16 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-3 bg-gray-200 rounded w-32" />
        <div className="h-7 bg-gray-200 rounded w-full" />
        <div className="h-7 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-48" />
        <div className="h-12 bg-gray-200 rounded w-48 mt-2" />
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-24 bg-gray-200 rounded-xl mt-4" />
      </div>
    </div>
  )
}

function RelatedCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

/* ─────────── main page ─────────── */

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<StorefrontProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantStorefront | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [relatedProducts, setRelatedProducts] = useState<StorefrontProduct[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  const [search, setSearch] = useState("")
  const { isFavorited, toggle: toggleFavorite } = useFavorites()

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getProductById(id)
      if (res.success && res.product) {
        setProduct(res.product)
        setSelectedImage(0)
        setSelectedVariant(null)
        setQuantity(1)

        if (res.product.categoryId) {
          setLoadingRelated(true)
          try {
            const rel = await getProducts({
              categoryId: res.product.categoryId,
              pageSize: 6,
              sortBy: "newest",
            })
            if (rel.success) {
              setRelatedProducts(rel.products.filter((p) => p.id !== id))
            }
          } catch {
            /* ignore related error */
          } finally {
            setLoadingRelated(false)
          }
        }
      } else {
        setError(res.message ?? "Không tìm thấy sản phẩm")
      }
    } catch {
      setError("Có lỗi xảy ra khi tải sản phẩm")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/?search=${encodeURIComponent(search.trim())}`)
  }

  const displayPrice = selectedVariant?.price ?? product?.basePrice ?? 0
  const activeVariants = product?.variants?.filter((v) => v.isActive) ?? []
  const images = product?.imageUrls ?? []

  /* ─── header ─── */
  const header = (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{ backgroundColor: "rgba(248,247,246,0.96)", borderColor: "#e5ded6" }}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-primary)" }}>
            local_florist
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight hidden sm:block" style={{ color: "var(--color-text-main)" }}>
            EcomViet
          </h1>
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-4">
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
        </form>

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
    </header>
  )

  /* ─── footer ─── */
  const footer = (
    <>
      <Separator className="bg-gray-200 mt-12" />
      <footer className="pt-8 pb-8">
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
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p>© 2025 EcomViet Marketplace. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-black transition-colors">Điều khoản dịch vụ</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )

  /* ─── error / not found ─── */
  if (!loading && error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}>
        {header}
        <main className="flex-grow flex flex-col items-center justify-center gap-4 text-center px-4">
          <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
          <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-400 max-w-sm">{error}</p>
          <Link
            href="/"
            className="mt-2 px-6 py-3 rounded-xl text-white font-semibold transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Về trang chủ
          </Link>
        </main>
        {footer}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      {header}

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 space-y-4">

        {/* Breadcrumb */}
        {!loading && product && (
          <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>home</span>
              Trang chủ
            </Link>
            {product.categoryName && (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
                <Link
                  href={`/?category=${product.categoryId}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {product.categoryName}
                </Link>
              </>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
            <span className="text-gray-600 line-clamp-1 max-w-[200px]">{product.name}</span>
          </nav>
        )}

        {/* Main product section */}
        <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
          {loading ? (
            <DetailSkeleton />
          ) : product ? (
            <div className="grid lg:grid-cols-[2fr_3fr] gap-8 xl:gap-12">
              {/* ── Image gallery ── */}
              <div className="flex flex-col gap-3">
                <div
                  className="relative aspect-square overflow-hidden bg-gray-100 border border-gray-100"
                  style={{ backgroundColor: "var(--color-background-light)" }}
                >
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                      <span className="material-symbols-outlined text-6xl">image</span>
                      <span className="text-sm">Chưa có ảnh</span>
                    </div>
                  )}

                  {/* Image counter badge */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 text-xs text-white px-2 py-1 rounded-full bg-black/40 font-medium">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}

                  {/* Prev/Next arrows for main image */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                      </button>
                      <button
                        onClick={() => setSelectedImage((p) => (p + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {images.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`shrink-0 size-16 rounded-lg overflow-hidden border-2 transition-all ${
                          i === selectedImage
                            ? "border-[var(--color-primary)] shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Product info ── */}
              <div className="flex flex-col gap-5">
                {/* Category badge */}
                {product.categoryName && (
                  <Link
                    href={`/?category=${product.categoryId}`}
                    className="self-start text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide transition-colors hover:opacity-80"
                    style={{ backgroundColor: "rgba(236,127,19,0.12)", color: "var(--color-text-secondary)" }}
                  >
                    {product.categoryName}
                  </Link>
                )}

                {/* Name */}
                <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: "var(--color-text-main)" }}>
                  {product.name}
                </h1>

                {/* Rating + sold */}
                <div className="flex items-center flex-wrap gap-4 text-sm">
                  <StarRating rating={product.averageRating} count={product.reviewCount} />
                  {product.soldCount > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">
                        Đã bán{" "}
                        <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                          {formatSold(product.soldCount)}
                        </span>
                      </span>
                    </>
                  )}
                </div>

                <Separator className="bg-gray-100" />

                {/* Price */}
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-4xl font-bold" style={{ color: "#E07A5F" }}>
                    {formatPrice(displayPrice)}
                  </span>
                  {selectedVariant && (
                    <span className="text-sm text-gray-400 mb-1">{selectedVariant.variantName}</span>
                  )}
                </div>

                {/* Variants */}
                {activeVariants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Phân loại</p>
                    <div className="flex flex-wrap gap-2">
                      {activeVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                          className={`px-4 py-2 text-sm rounded-lg border-2 transition-all font-medium ${
                            selectedVariant?.id === v.id
                              ? "border-[var(--color-primary)] bg-[rgba(236,127,19,0.08)] text-[var(--color-primary)]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {v.variantName}
                          {v.price != null && v.price !== product.basePrice && (
                            <span className="ml-1 font-normal text-xs text-gray-400">
                              +{formatPrice(v.price - product.basePrice)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Số lượng</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-sm font-semibold py-2 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-[rgba(236,127,19,0.06)]"
                    style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                  >
                    <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                    Thêm vào giỏ
                  </button>
                  <button
                    className="flex-1 min-w-[140px] py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Mua ngay
                  </button>
                  {product && (
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="size-[52px] flex items-center justify-center rounded-xl border-2 transition-all hover:scale-105 active:scale-95 shrink-0"
                      style={{
                        borderColor: isFavorited(product.id) ? "#ef4444" : "#e5e7eb",
                        backgroundColor: isFavorited(product.id) ? "rgba(239,68,68,0.06)" : "transparent",
                        color: isFavorited(product.id) ? "#ef4444" : "#9ca3af",
                      }}
                      aria-label={isFavorited(product.id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ fontVariationSettings: isFavorited(product.id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  )}
                </div>

                {/* Perks */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "local_shipping", text: "Miễn phí vận chuyển" },
                    { icon: "verified", text: "Hàng chính hãng" },
                    { icon: "autorenew", text: "Đổi trả trong 7 ngày" },
                    { icon: "support_agent", text: "Hỗ trợ 24/7" },
                  ].map((perk) => (
                    <div key={perk.text} className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {perk.icon}
                      </span>
                      {perk.text}
                    </div>
                  ))}
                </div>

                <Separator className="bg-gray-100" />

                {/* Shop info */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100"
                  style={{ backgroundColor: "var(--color-background-light)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: "var(--color-text-secondary)" }}
                    >
                      {product.shopName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text-main)" }}>
                        {product.shopName}
                      </p>
                      <p className="text-xs text-gray-400">Cửa hàng chính thức</p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#e5ded6", color: "var(--color-text-secondary)" }}
                  >
                    Xem shop
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Description */}
        {!loading && product?.description && (
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Mô tả sản phẩm
            </h2>
            <div
              className="text-sm leading-relaxed text-gray-600 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, "<br/>") }}
            />
          </section>
        )}

        {/* Reviews placeholder */}
        {!loading && product && (
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Đánh giá sản phẩm
            </h2>
            {product.reviewCount > 0 ? (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-extrabold" style={{ color: "#f59e0b" }}>
                    {product.averageRating.toFixed(1)}
                  </div>
                  <StarRating rating={product.averageRating} count={0} />
                  <p className="text-xs text-gray-400 mt-1">{product.reviewCount} đánh giá</p>
                </div>
                <Separator orientation="vertical" className="hidden sm:block h-20 bg-gray-100" />
                <div className="flex-1 flex flex-col justify-center gap-1 w-full">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{star}</span>
                      <span className="material-symbols-outlined text-sm" style={{ color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>star</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: star === Math.round(product.averageRating) ? "60%" : star > product.averageRating ? "10%" : "30%",
                            backgroundColor: "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-2">rate_review</span>
                <p className="font-medium">Chưa có đánh giá nào</p>
                <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này</p>
              </div>
            )}
          </section>
        )}

        {/* Related products */}
        {!loading && relatedProducts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--color-text-secondary)" }} />
              Sản phẩm tương tự
            </h2>
            {loadingRelated ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <RelatedCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedProducts.map((p) => {
                  const img = p.imageUrls?.[0]
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-[rgba(236,127,19,0.5)] hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-xs text-gray-500 mb-1">{p.shopName}</p>
                        <h3 className="text-sm mb-1 line-clamp-2 flex-1" style={{ color: "var(--color-text-main)" }}>
                          {p.name}
                        </h3>
                        <span className="font-bold text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                          {formatPrice(p.basePrice)}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {footer}
    </div>
  )
}
