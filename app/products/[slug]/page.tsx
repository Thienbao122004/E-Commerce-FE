"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  getProductBySlug,
  getProducts,
  type StorefrontProductDetail,
  type StorefrontProduct,
  type ProductVariantStorefront,
} from "@/services/storefront-products"
import { getCategoryById } from "@/services/storefront-categories"
import { getShopBySlug, type ShopPublicDto } from "@/services/storefront-shops"
import { useFavorites } from "@/contexts/favorites-context"
import { cartService } from "@/services/cart"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  formatCompactNumber,
  formatJoinTime,
  formatPriceVND as formatPrice,
  formatSoldCount as formatSold,
} from "@/lib/formatters"
import { resolveMinVariantPrice } from "@/lib/product-pricing"
const CART_UPDATED_EVENT = "cart:updated"

import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { StorefrontFooter } from "@/components/layout/storefront-footer"
import { ProductReviewsSection } from "./_components/product-reviews-section"

function parseVariantAttributes(raw?: string | null): Record<string, string> {
  if (!raw) return {}
  let attrStr: string | null = null;
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === "string") {
      attrStr = parsed; // Legacy encoded string literals, e.g. "\"Màu đỏ\""
    } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [k, v]) => {
        if (!k) return acc
        if (typeof v === "string" || typeof v === "number") {
          acc[k] = String(v)
        }
        return acc
      }, {})
    } else {
      return {}
    }
  } catch {
    attrStr = raw;
  }
  
  if (!attrStr) return {};

  const result: Record<string, string> = {};
  const leftoverSegments: string[] = [];
  
  const segments = attrStr.split(',');
  for (const seg of segments) {
     let text = seg.trim();
     if (!text) continue;
     const firstColon = text.indexOf(':');
     if (firstColon > 0) {
        let k = text.substring(0, firstColon).trim();
        let v = text.substring(firstColon + 1).trim();
        
        if (k.toLowerCase() === 'size') {
           k = 'Size';
           v = v.toUpperCase();
        } else if (k.toLowerCase() === 'màu' || k.toLowerCase() === 'màu sắc') {
           k = 'Màu';
           v = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        } else {
           k = k.charAt(0).toUpperCase() + k.slice(1);
        }

        if (k) {
           if (result[k]) result[k] += `, ${v}`;
           else result[k] = v;
        } else {
           leftoverSegments.push(text);
        }
     } else {
        const lower = text.toLowerCase();
        if (lower.startsWith('size ') || lower.startsWith('size')) {
           const val = text.substring(4).trim();
           if (val) {
             const finalVal = val.toUpperCase();
             if (result['Size']) result['Size'] += `, ${finalVal}`;
             else result['Size'] = finalVal;
             continue;
           }
        } else if (lower.startsWith('màu ') || lower.startsWith('màu')) {
           const idx = lower.startsWith('màu sắc') ? 7 : 3;
           const val = text.substring(idx).trim();
           if (val) {
             const finalVal = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
             if (result['Màu']) result['Màu'] += `, ${finalVal}`;
             else result['Màu'] = finalVal;
             continue;
           }
        }
        
        const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
        leftoverSegments.push(capitalizedText);
     }
  }
  
  if (leftoverSegments.length > 0) {
      if (Object.keys(result).length === 0) {
         result["Phân loại"] = leftoverSegments.join(", ");
      } else {
         result["Thuộc tính khác"] = leftoverSegments.join(", ");
      }
  }
  
  return result;
}


function showAddedToCartToast(productName: string, quantity: number) {
  toast.custom(
    (id) => (
      <div className="mt-14 md:mt-16 w-[320px] rounded-xl border border-emerald-200 bg-emerald-50 shadow-md px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center size-7">
            <span className="material-symbols-outlined text-base">check</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-700">Đã thêm vào giỏ hàng</p>
            <p className="mt-1 text-xs text-emerald-800 truncate">
              +{quantity} {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="text-emerald-600 hover:text-emerald-800 transition-colors"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    ),
    { duration: 2200 }
  )
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
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { session } = useAuth()

  const [product, setProduct] = useState<StorefrontProductDetail | null>(null)
  const [shopInfo, setShopInfo] = useState<ShopPublicDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantStorefront | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)

  const [relatedProducts, setRelatedProducts] = useState<StorefrontProduct[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [categoryParent, setCategoryParent] = useState<{
    id: number
    name: string
    slug: string
  } | null>(null)

  const [search, setSearch] = useState("")
  const [addingToCart, setAddingToCart] = useState(false)
  const { isFavorited, toggle: toggleFavorite } = useFavorites()

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    setCategoryParent(null)
    try {
      const res = await getProductBySlug(slug)
      if (res.success && res.product) {
        setProduct(res.product)
        setShopInfo(null)
        setSelectedImage(0)
        const firstActiveVariant = res.product.variants?.find((v) => v.isActive) ?? null
        setSelectedVariant(firstActiveVariant)
        setSelectedAttributes(firstActiveVariant ? parseVariantAttributes(firstActiveVariant.attributes) : {})
        setQuantity(1)

        if (res.product.shopSlug) {
          try {
            const shopRes = await getShopBySlug(res.product.shopSlug, session?.access_token)
            if (shopRes.success && shopRes.shop) {
              setShopInfo(shopRes.shop)
            }
          } catch {
          }
        }

        if (res.product.categoryId) {
          setLoadingRelated(true)
          try {
            const catRes = await getCategoryById(res.product.categoryId)
            if (catRes.success && catRes.category?.parentId) {
              const parentRes = await getCategoryById(catRes.category.parentId)
              if (parentRes.success && parentRes.category) {
                const p = parentRes.category
                setCategoryParent({
                  id: p.id,
                  name: p.name,
                  slug: p.slug || String(p.id),
                })
              } else {
                setCategoryParent(null)
              }
            } else {
              setCategoryParent(null)
            }

            const rel = await getProducts({
              categoryId: res.product.categoryId,
              pageSize: 6,
              sortBy: "newest",
            })
            if (rel.success) {
              setRelatedProducts(rel.products.filter((p) => p.slug !== slug))
            }
          } catch {
            setCategoryParent(null)
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
  }, [slug, session?.access_token])

  useEffect(() => {
    load()
  }, [load])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const keyword = search.trim()
    if (keyword) router.push(`/?search=${encodeURIComponent(keyword)}`)
  }, [router, search])

  const handleQuantityInput = useCallback(
    (value: string) => {
      const maxStock = selectedVariant?.stockQuantity ?? product?.totalStock ?? 0
      const digitsOnly = value.replace(/\D/g, "")
      if (!digitsOnly) {
        setQuantity(1)
        return
      }

      const parsed = Number(digitsOnly)
      if (Number.isNaN(parsed)) return

      if (maxStock > 0) {
        setQuantity(Math.min(Math.max(1, parsed), maxStock))
      } else {
        setQuantity(Math.max(1, parsed))
      }
    },
    [selectedVariant?.stockQuantity, product?.totalStock]
  )

  const handleAddToCart = async (buyNow = false) => {
    if (!product) return

    if (!session) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng")
      router.push("/login")
      return
    }

    const stock =
      selectedVariant?.stockQuantity ??
      product.totalStock ??
      0

    if (stock <= 0) {
      toast.error("Sản phẩm đã hết hàng")
      return
    }

    if (quantity > stock) {
      toast.error("Số lượng vượt quá tồn kho", {
        description: `Tồn kho hiện có: ${stock}`,
      })
      return
    }

    setAddingToCart(true)
    try {
      await cartService.addItem({
        productId: product.id,
        variantId: selectedVariant?.id ?? undefined,
        quantity,
      })
      window.dispatchEvent(new Event(CART_UPDATED_EVENT))
      if (buyNow) {
        router.push("/user/cart")
      } else {
        showAddedToCartToast(product.name, quantity)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng"
      toast.error(msg)
    } finally {
      setAddingToCart(false)
    }
  }

  const minVariantPrice = resolveMinVariantPrice(product?.basePrice ?? 0, product?.variants)
  const displayPrice = selectedVariant?.price ?? (selectedVariant ? product?.basePrice ?? 0 : minVariantPrice)
  const activeVariants = useMemo(
    () => product?.variants?.filter((v) => v.isActive) ?? [],
    [product?.variants]
  )
  const variantsWithParsedAttributes = useMemo(() => {
    let list = activeVariants.map((v) => ({ ...v, parsedAttributes: parseVariantAttributes(v.attributes) }))
    
    const attrSet = new Set<string>()
    let hasCollision = false
    for (const v of list) {
       const key = JSON.stringify(v.parsedAttributes, Object.keys(v.parsedAttributes).sort())
       if (attrSet.has(key)) {
          hasCollision = true; break;
       }
       attrSet.add(key)
    }

     if (hasCollision) {
       list = list.map(v => {
         const nameValue = v.variantName.trim() || "Mặc định"
         const priceValue = formatPrice(v.price ?? minVariantPrice)
         return {
           ...v,
           parsedAttributes: {
             "Loại": `${nameValue} - ${priceValue}`,
             ...v.parsedAttributes
           }
         }
       })
     }
    
    return list;
  }, [activeVariants])
  const variantAttributeGroups = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const variant of variantsWithParsedAttributes) {
      for (const [key, value] of Object.entries(variant.parsedAttributes)) {
        if (!map.has(key)) map.set(key, new Set<string>())
        map.get(key)!.add(value)
      }
    }
    return Array.from(map.entries()).map(([key, values]) => ({ key, values: Array.from(values) }))
  }, [variantsWithParsedAttributes])
  const images = useMemo(() => product?.imageUrls ?? [], [product?.imageUrls])
  const currentStock = useMemo(
    () => selectedVariant?.stockQuantity ?? product?.totalStock ?? 0,
    [selectedVariant?.stockQuantity, product?.totalStock]
  )

  const handleSelectAttribute = useCallback((groupKey: string, groupValue: string) => {
    let nextAttributes = { ...selectedAttributes, [groupKey]: groupValue }
    
    let matched = variantsWithParsedAttributes.find((variant) =>
      Object.entries(nextAttributes).every(([key, value]) => variant.parsedAttributes[key] === value)
    )

    if (!matched) {
      matched = variantsWithParsedAttributes.find((variant) => variant.parsedAttributes[groupKey] === groupValue)
      if (matched) {
         nextAttributes = { ...matched.parsedAttributes }
      }
    }

    setSelectedAttributes(nextAttributes)
    if (matched && matched.id !== selectedVariant?.id) {
      setSelectedVariant(matched)
    }
  }, [selectedAttributes, variantsWithParsedAttributes, selectedVariant?.id])

  useEffect(() => {
    if (!product) return
    setQuantity((prev) => {
      if (currentStock <= 0) return 1
      return prev > currentStock ? currentStock : prev
    })
  }, [product, selectedVariant?.id, currentStock])

  const header = <MainStorefrontHeader />

  const footer = <StorefrontFooter />

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
            {categoryParent && (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
                <Link
                  href={`/search?category=${encodeURIComponent(categoryParent.slug || String(categoryParent.id))}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {categoryParent.name}
                </Link>
              </>
            )}
            {product.categoryName && (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
                <Link
                  href={`/search?category=${encodeURIComponent(product.categorySlug || String(product.categoryId))}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {product.categoryName}
                </Link>
              </>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
            <span className="text-gray-600 truncate max-w-[600px]">{product.name}</span>
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

              <div className="flex flex-col gap-5">
                <h1 className="text-2xl md:text-2xl font-bold leading-tight" style={{ color: "var(--color-text-main)" }}>
                  {product.name}
                </h1>
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

                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-4xl font-bold" style={{ color: "#E07A5F" }}>
                    {formatPrice(displayPrice)}
                  </span>
                  {selectedVariant && (
                    <span className="text-sm text-gray-400 mb-1">{selectedVariant.variantName}</span>
                  )}
                </div>

                {/* Variants */}
                {variantAttributeGroups.length > 0 ? (
                  <div className="space-y-3">
                    {variantAttributeGroups.map((group) => (
                      <div key={group.key} className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">{group.key}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.values.map((value) => {
                            const selected = selectedAttributes[group.key] === value
                            return (
                              <button
                                key={`${group.key}-${value}`}
                                type="button"
                                onClick={() => handleSelectAttribute(group.key, value)}
                                className={`px-4 py-2 text-sm rounded-lg border-2 transition-all font-medium ${
                                  selected
                                    ? "border-[var(--color-primary)] bg-[rgba(236,127,19,0.08)] text-[var(--color-primary)]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                              >
                                {value}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeVariants.length > 0 && (
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
                          {v.price != null && v.price !== minVariantPrice && (
                            <span className="ml-1 font-normal text-xs text-gray-400">
                              +{formatPrice(v.price - minVariantPrice)}
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
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(e) => handleQuantityInput(e.target.value)}
                      onBlur={() => {
                        if (quantity < 1) {
                          setQuantity(1)
                          return
                        }
                        if (currentStock > 0 && quantity > currentStock) {
                          setQuantity(currentStock)
                        }
                      }}
                      className="w-16 h-10 text-center text-sm font-semibold border-x border-gray-200 focus:outline-none focus:ring-0"
                      aria-label="Nhập số lượng"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold"
                      disabled={currentStock > 0 ? quantity >= currentStock : false}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {currentStock <= 0 ? (
                      <span className="text-red-500 font-medium">Hết hàng</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-600">{currentStock}</span>
                        sản phẩm có sẵn
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={addingToCart || currentStock <= 0}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-[rgba(236,127,19,0.06)] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                  >
                    {addingToCart ? (
                      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                    )}
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={addingToCart || currentStock <= 0}
                    className="flex-1 min-w-[70px] py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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

                {/* ══ Local Specialty Badge ══ */}
                {product.localMeta && (
                  <div className="py-4 border-t border-gray-100">
                    <div className="rounded-2xl border border-[#d4a96a] bg-gradient-to-br from-[#fffbf2] to-[#fef3dc] p-4 flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: "#b06017" }}>eco</span>
                        <span className="text-sm font-bold" style={{ color: "#7a4a1e" }}>
                          {product.localMeta.archetypeName}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border" style={{ background: "#fde8c8", color: "#b06017", borderColor: "#f0c890" }}>
                          Local Brand · {product.localMeta.provinceName}
                        </span>
                      </div>

                      {/* Đặc điểm nổi bật */}
                      {product.localMeta.selectedTraits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {product.localMeta.selectedTraits.map((trait) => (
                            <span
                              key={trait}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium"
                              style={{ background: "#fff7ed", color: "#92400e", borderColor: "#fcd38d" }}
                            >
                              <span className="material-symbols-outlined text-[12px]" style={{ color: "#b45309" }}>check_circle</span>
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Display note */}
                      {product.localMeta.displayNote && (
                        <p className="text-[12px] leading-relaxed" style={{ color: "#78480f" }}>
                          {product.localMeta.displayNote}
                        </p>
                      )}

                      {/* Footer note */}
                      <p className="text-[10px]" style={{ color: "#a07040" }}>
                        Thông tin đặc sản được xác nhận theo hồ sơ chuẩn của nền tảng.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags & Materials */}
                {(product.tags?.length || product.materials?.length) ? (
                  <div className="flex flex-col gap-3 py-4 border-t border-gray-100">
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-gray-600 min-w-[70px]">Từ khóa:</span>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map(t => (
                            <span key={t} className="px-2.5 py-1 text-xs rounded-md bg-orange-50 text-orange-700 border border-orange-100">#{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.materials && product.materials.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-gray-600 min-w-[70px] mt-0.5">Chất liệu:</span>
                        <div className="flex flex-wrap gap-2">
                          {product.materials.map(m => (
                            <span key={m} className="px-2.5 py-1 text-xs rounded-md bg-gray-100 text-gray-700 border border-gray-200">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {!loading && product && (
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex items-start gap-4 lg:min-w-[430px]">
                <div className="size-20 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center" style={{ backgroundColor: "#f0ebe4" }}>
                  {shopInfo?.logoUrl ? (
                    <img src={shopInfo.logoUrl} alt={product.shopName} className="size-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: "var(--color-text-secondary)" }}>
                      {product.shopName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-3xl font-semibold leading-tight" style={{ color: "var(--color-text-main)" }}>{product.shopName}</h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>Online gần đây</p>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("open-chat-widget", {
                          detail: {
                            shopId: product.shopId,
                            product: {
                              id: product.id,
                              slug: product.slug,
                              name: product.name,
                              imageUrl: product.imageUrls?.[0] ?? null,
                              price: displayPrice,
                              shopId: product.shopId,
                            },
                          },
                        }))
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-orange-50"
                      style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>
                      Chat Ngay
                    </button>
                    <Link
                      href={`/shop/${product.shopSlug || product.shopId}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#e5ded6", color: "var(--color-text-secondary)" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>storefront</span>
                      Xem Shop
                    </Link>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block self-stretch w-px bg-gray-200" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 flex-1">
                <div>
                  <p className="text-sm text-gray-500">Sản Phẩm</p>
                  <p className="text-sm" style={{ color: "var(--color-primary)" }}>{shopInfo ? formatCompactNumber(shopInfo.productCount) : "Đang cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đánh Giá</p>
                  <p className="text-sm" style={{ color: "var(--color-primary)" }}>{shopInfo ? `${shopInfo.averageRating.toFixed(1)} (${formatCompactNumber(shopInfo.reviewCount)})` : "Đang cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tham Gia</p>
                  <p className="text-sm" style={{ color: "var(--color-primary)" }}>{formatJoinTime(shopInfo?.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Người Theo Dõi</p>
                  <p className="text-sm" style={{ color: "var(--color-primary)" }}>{shopInfo ? formatCompactNumber(shopInfo.followerCount) : "Đang cập nhật"}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Description */}
        {!loading && product?.description && (
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Mô tả sản phẩm
            </h2>
            <div className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
              {product.description}
            </div>
          </section>
        )}

        {/* Đánh giá từ người mua (API công khai) */}
        {!loading && product && (
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-main)" }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Đánh giá sản phẩm
            </h2>
            <ProductReviewsSection
              productId={product.id}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
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
                      href={`/products/${p.slug || p.id}`}
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
                        <h3 className="text-sm mb-1 truncate flex-1" style={{ color: "var(--color-text-main)" }}>
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
