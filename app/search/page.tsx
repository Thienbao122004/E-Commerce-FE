"use client"

import { useState, useEffect, useCallback, useMemo, useRef, Suspense, Fragment } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getProducts, type StorefrontProduct } from "@/services/storefront-products"
import { getCategories, getCategoryById, type StorefrontCategory } from "@/services/storefront-categories"
import { useFavorites } from "@/contexts/favorites-context"
import { Separator } from "@/components/ui/separator"
import { MainStorefrontHeader } from "@/components/layout/main-storefront-header"
import { formatPriceVND as formatPrice } from "@/lib/formatters"

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


function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") ?? ""
  const categorySlug = searchParams.get("category") ?? ""
  const { isFavorited, toggle: toggleFavorite } = useFavorites()

  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [baseCategories, setBaseCategories] = useState<StorefrontCategory[]>([])
  const [activeParentCategory, setActiveParentCategory] = useState<StorefrontCategory | null>(null)
  const [subCategories, setSubCategories] = useState<StorefrontCategory[]>([])
  const [searchCategories, setSearchCategories] = useState<StorefrontCategory[]>([])
  const [shopResults, setShopResults] = useState<Array<{ slug: string; name: string; logoUrl?: string | null }>>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)
  const [initialCategorySet, setInitialCategorySet] = useState(false)
  const [showMoreCategories, setShowMoreCategories] = useState(false)
  const [priceMinInput, setPriceMinInput] = useState("")
  const [priceMaxInput, setPriceMaxInput] = useState("")
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(undefined)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(undefined)
  const [appliedMinRating, setAppliedMinRating] = useState<number | undefined>(undefined)

  const PAGE_SIZE = 110
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const mainRef = useRef<HTMLDivElement>(null)
  const effectiveCategoryId = selectedCategory ?? activeParentCategory?.id

  const loadProducts = useCallback(async (
    q: string,
    p: number,
    sort: typeof sortBy,
    catId: number | undefined,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
  ) => {
    setLoading(true)
    try {
      const res = await getProducts({ search: q, page: p, pageSize: PAGE_SIZE, sortBy: sort, categoryId: catId, minPrice, maxPrice, minRating })
      if (res.success) {
        setProducts(res.products)
        setTotalCount(res.totalCount)
        if (p === 1) {
          const uniqueShops = new Map<string, { slug: string; name: string; logoUrl?: string | null }>()
          for (const prod of res.products) {
            if (prod.shopSlug && !uniqueShops.has(prod.shopSlug)) {
              if (q && prod.shopName.toLowerCase().includes(q.trim().toLowerCase())) {
                uniqueShops.set(prod.shopSlug, { slug: prod.shopSlug, name: prod.shopName, logoUrl: prod.shopLogoUrl })
              }
            }
          }
          let shops = Array.from(uniqueShops.values())
          if (shops.length === 0 && q) {
            const fallbackShops = new Map<string, { slug: string; name: string; logoUrl?: string | null }>()
            for (const prod of res.products) {
              if (prod.shopSlug && !fallbackShops.has(prod.shopSlug)) {
                fallbackShops.set(prod.shopSlug, { slug: prod.shopSlug, name: prod.shopName, logoUrl: prod.shopLogoUrl })
              }
            }
            shops = Array.from(fallbackShops.values())
          }
          setShopResults(shops.slice(0, 4))
        } else {
          setShopResults([])
        }
      }
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (categorySlug && !initialCategorySet) return
    setPage(1)
    setProducts([])
    loadProducts(query, 1, sortBy, effectiveCategoryId, appliedMinPrice, appliedMaxPrice, appliedMinRating)
  }, [query, sortBy, effectiveCategoryId, appliedMinPrice, appliedMaxPrice, appliedMinRating, loadProducts, categorySlug, initialCategorySet])

  useEffect(() => {
    getCategories({ pageSize: 100, level: 1 }).then((res) => {
      if (res.success) {
        setBaseCategories(res.categories)

        if (categorySlug && !initialCategorySet) {
          const matchedCategory = res.categories.find(
            (cat) => cat.slug === categorySlug || cat.code === categorySlug || String(cat.id) === categorySlug
          )
          if (matchedCategory) {
            setActiveParentCategory(matchedCategory)
            setSelectedCategory(undefined)
          } else {
            const id = parseInt(categorySlug, 10)
            if (!isNaN(id)) {
              getCategoryById(id)
                .then((detailRes) => {
                  if (!detailRes.success || !detailRes.category) return
                  const category = detailRes.category

                  if (category.parentId) {
                    setSelectedCategory(category.id)
                    getCategoryById(category.parentId)
                      .then((parentRes) => {
                        if (parentRes.success && parentRes.category) {
                          setActiveParentCategory(parentRes.category)
                        }
                      })
                      .catch(() => { })
                  } else {
                    setActiveParentCategory(category)
                    setSelectedCategory(undefined)
                  }
                })
                .catch(() => { })
            }
          }
          setInitialCategorySet(true)
        }
      }
    }).catch(() => { })
  }, [categorySlug, initialCategorySet])

  useEffect(() => {
    if (activeParentCategory) {
      getCategoryById(activeParentCategory.id)
        .then((res) => {
          if (res.success && res.category?.subcategories) {
            setSubCategories(res.category.subcategories)
          } else {
            setSubCategories([])
          }
        })
        .catch(() => setSubCategories([]))
    } else {
      setSubCategories([])
    }
  }, [activeParentCategory])

  useEffect(() => {
    if (query && !selectedCategory && products.length > 0) {
      const map = new Map<number, StorefrontCategory>()
      products.forEach(p => {
        if (p.categoryId && p.categoryName) {
          if (!map.has(p.categoryId)) {
            map.set(p.categoryId, {
              id: p.categoryId,
              name: p.categoryName,
              slug: p.categorySlug || p.categoryId.toString(),
            } as StorefrontCategory)
          }
        }
      })
      if (map.size > 0) setSearchCategories(Array.from(map.values()))
    }
  }, [products, query, selectedCategory])

  const displayCategories = useMemo(() => {
    if (activeParentCategory) return subCategories
    if (query && searchCategories.length > 0) return searchCategories
    return baseCategories
  }, [activeParentCategory, query, searchCategories, subCategories, baseCategories])

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory !== undefined) {
      const selectedSub = subCategories.find((c) => c.id === selectedCategory)
      if (selectedSub) return selectedSub.name

      const selectedBase = baseCategories.find((c) => c.id === selectedCategory)
      if (selectedBase) return selectedBase.name

      const selectedSearch = searchCategories.find((c) => c.id === selectedCategory)
      if (selectedSearch) return selectedSearch.name
    }

    return activeParentCategory?.name
  }, [selectedCategory, subCategories, baseCategories, searchCategories, activeParentCategory])

  const breadcrumbCategoryNames = useMemo(() => {
    if (activeParentCategory && selectedCategoryName && selectedCategoryName !== activeParentCategory.name) {
      return [activeParentCategory.name, selectedCategoryName]
    }
    if (selectedCategoryName) return [selectedCategoryName]
    return []
  }, [activeParentCategory, selectedCategoryName])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    loadProducts(query, newPage, sortBy, effectiveCategoryId, appliedMinPrice, appliedMaxPrice, appliedMinRating)
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const formatThousands = (raw: string) =>
    raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''

  const handleApplyPrice = () => {
    setAppliedMinPrice(priceMinInput ? Number(priceMinInput) : undefined)
    setAppliedMaxPrice(priceMaxInput ? Number(priceMaxInput) : undefined)
  }

  const handleCategoryChange = (cat: StorefrontCategory | undefined) => {
    if (!cat) {
      setSelectedCategory(undefined)
    } else if (activeParentCategory) {
      setSelectedCategory(cat.id)
    } else {
      setActiveParentCategory(cat)
      setSelectedCategory(undefined)
      setShowMoreCategories(false)
    }

    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (cat?.slug) {
      params.set('category', cat.slug)
    } else if (activeParentCategory?.slug) {
      params.set('category', activeParentCategory.slug)
    }

    router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  const handleClearAll = () => {
    setActiveParentCategory(null)
    setSelectedCategory(undefined)
    setSubCategories([])
    setPriceMinInput("")
    setPriceMaxInput("")
    setAppliedMinPrice(undefined)
    setAppliedMaxPrice(undefined)
    setAppliedMinRating(undefined)
    if (query) setSearchCategories([])
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  const hasActiveFilters = activeParentCategory !== null || selectedCategory !== undefined || appliedMinPrice !== undefined || appliedMaxPrice !== undefined || appliedMinRating !== undefined

  const RATING_FILTER_OPTIONS = [5, 4, 3, 2, 1]

  const SORT_OPTIONS: { value: typeof sortBy; label: string }[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "rating", label: "Đánh giá cao" },
    { value: "price_asc", label: "Giá tăng dần" },
    { value: "price_desc", label: "Giá giảm dần" },
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-light)", color: "var(--color-text-main)" }}
    >
      <MainStorefrontHeader />
      <main ref={mainRef} className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span style={{ color: "var(--color-text-main)" }}>Tìm kiếm</span>
            {breadcrumbCategoryNames.map((name, idx) => (
              <Fragment key={`${name}-${idx}`}>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span style={{ color: "var(--color-text-main)" }}>{name}</span>
              </Fragment>
            ))}
          </div>
          {query && (
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-main)" }}>
              Kết quả cho &quot;<span style={{ color: "var(--color-primary)" }}>{query}</span>&quot;
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">({totalCount} sản phẩm)</span>
              )}
            </h2>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-secondary)" }}>filter_list</span>
                <h3 className="text-sm font-black tracking-wide uppercase" style={{ color: "var(--color-text-main)" }}>Bộ lọc tìm kiếm</h3>
              </div>

              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-main)" }}>Theo Danh Mục</p>
                <ul className="space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleCategoryChange(undefined)}
                      className="w-full flex items-center gap-2 text-left text-xs py-1.5 transition-colors hover:text-[var(--color-primary)]"
                      style={{ color: selectedCategory === undefined ? "var(--color-primary)" : "var(--color-text-main)" }}
                    >
                      <span
                        className="size-3.5 rounded-sm border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: selectedCategory === undefined ? "var(--color-primary)" : "#d1d5db",
                          backgroundColor: selectedCategory === undefined ? "var(--color-primary)" : "white",
                        }}
                      >
                        {selectedCategory === undefined && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                      </span>
                      Tất cả
                    </button>
                  </li>
                  {(showMoreCategories ? displayCategories : displayCategories.slice(0, 5)).map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategoryChange(cat)}
                        className="w-full flex items-center gap-2 text-left text-xs py-1.5 transition-colors hover:text-[var(--color-primary)]"
                        style={{ color: selectedCategory === cat.id ? "var(--color-primary)" : "var(--color-text-main)" }}
                      >
                        <span
                          className="size-3.5 rounded-sm border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: selectedCategory === cat.id ? "var(--color-primary)" : "#d1d5db",
                            backgroundColor: selectedCategory === cat.id ? "var(--color-primary)" : "white",
                          }}
                        >
                          {selectedCategory === cat.id && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                        </span>
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {displayCategories.length > 5 && (
                  <button
                    onClick={() => setShowMoreCategories((p) => !p)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--color-primary)]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {showMoreCategories ? "Thu gọn" : "Thêm"}
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {showMoreCategories ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                )}
              </div>

              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-main)" }}>Khoảng Giá</p>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex items-center flex-1 rounded border border-gray-200 overflow-hidden">
                    <span className="text-[10px] text-gray-400 pl-1.5">₫</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="TỪ"
                      value={formatThousands(priceMinInput)}
                      onChange={(e) => setPriceMinInput(e.target.value.replace(/[^\d]/g, ""))}
                      className="w-full bg-transparent text-xs py-1.5 px-1 focus:outline-none placeholder:text-gray-300"
                    />
                  </div>
                  <span className="text-gray-300 text-xs">—</span>
                  <div className="flex items-center flex-1 rounded border border-gray-200 overflow-hidden">
                    <span className="text-[10px] text-gray-400 pl-1.5">₫</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="ĐẾN"
                      value={formatThousands(priceMaxInput)}
                      onChange={(e) => setPriceMaxInput(e.target.value.replace(/[^\d]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
                      className="w-full bg-transparent text-xs py-1.5 px-1 focus:outline-none placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyPrice}
                  className="w-full py-1.5 rounded text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  ÁP DỤNG
                </button>
              </div>

              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-main)" }}>Đánh Giá</p>
                <ul className="space-y-1">
                  {RATING_FILTER_OPTIONS.map((rating) => (
                    <li key={rating}>
                      <button
                        onClick={() => setAppliedMinRating((prev) => (prev === rating ? undefined : rating))}
                        className="w-full flex items-center gap-2 text-left text-xs py-1.5 transition-colors hover:text-[var(--color-primary)]"
                        style={{ color: appliedMinRating === rating ? "var(--color-primary)" : "var(--color-text-main)" }}
                      >
                        <span
                          className="size-3.5 rounded-sm border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: appliedMinRating === rating ? "var(--color-primary)" : "#d1d5db",
                            backgroundColor: appliedMinRating === rating ? "var(--color-primary)" : "white",
                          }}
                        >
                          {appliedMinRating === rating && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                        </span>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, idx) => (
                            <span
                              key={idx}
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 14,
                                color: idx < rating ? "#f59e0b" : "#d1d5db",
                                fontVariationSettings: idx < rating ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          ))}
                          <span className="ml-1">trở lên</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clear all */}
              {hasActiveFilters && (
                <div className="px-4 py-3">
                  <button
                    onClick={handleClearAll}
                    className="w-full py-1.5 rounded border text-xs font-bold transition-colors hover:border-red-400 hover:text-red-500"
                    style={{ borderColor: "#d1d5db", color: "var(--color-text-secondary)" }}
                  >
                    XÓA TẤT CẢ
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">Sắp xếp:</span>
                <div className="flex gap-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sortBy === opt.value
                          ? "text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        }`}
                      style={sortBy === opt.value ? { backgroundColor: "var(--color-primary)" } : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">search_off</span>
                <p className="text-lg font-bold text-gray-500">
                  {query ? `Không tìm thấy kết quả cho "${query}"` : "Nhập từ khóa để tìm kiếm"}
                </p>
                <p className="text-sm text-gray-400 mt-2">Thử tìm với từ khóa khác hoặc danh mục rộng hơn</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">home</span>
                  Về trang chủ
                </Link>
              </div>
            ) : (
              <>
                {shopResults.length > 0 && page === 1 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Gian hàng liên quan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {shopResults.map(shop => (
                        <Link 
                          key={shop.slug} 
                          href={`/shop/${shop.slug}`}
                          className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all"
                        >
                          <div className="size-12 rounded-full overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center bg-gray-50 text-[var(--color-primary)]">
                            {shop.logoUrl ? (
                              <img src={shop.logoUrl} alt={shop.name} className="size-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-2xl">storefront</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold truncate" style={{ color: "var(--color-text-main)" }}>{shop.name}</h4>
                            <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              Xem gian hàng <span className="material-symbols-outlined" style={{ fontSize: 12 }}>chevron_right</span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product) => {
                    const img = product.imageUrls?.[0]
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug || product.id}`}
                        className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-[rgba(236,127,19,0.5)] hover:shadow-md transition-all duration-300"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-5xl text-gray-300">image</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
                            className="absolute top-2 right-2 size-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                            style={{
                              backgroundColor: isFavorited(product.id) ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.85)",
                              color: isFavorited(product.id) ? "#ef4444" : "#9ca3af",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "18px", fontVariationSettings: isFavorited(product.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <p className="text-[11px] text-gray-400 truncate mb-1">{product.shopName}</p>
                          <h3 className="text-sm truncate flex-1" style={{ color: "var(--color-text-main)" }}>
                            {product.name}
                          </h3>
                          <div className="mt-2 flex items-end justify-between gap-1">
                            <span className="font-bold text-sm" style={{ color: "var(--color-text-secondary)" }}>
                              {formatPrice(product.basePrice)}
                            </span>
                            {product.soldCount > 0 && (
                              <span className="text-[11px] text-gray-400 shrink-0">
                                Đã bán {product.soldCount >= 1000
                                  ? `${(product.soldCount / 1000).toFixed(1)}k`
                                  : product.soldCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    {/* Prev */}
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="flex items-center justify-center size-9 rounded-lg border border-gray-200 bg-white text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--color-text-main)" }}
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                        acc.push(p)
                        return acc
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="flex items-center justify-center size-9 text-sm text-gray-400">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => handlePageChange(item as number)}
                            className="flex items-center justify-center size-9 rounded-lg border text-sm font-semibold transition-colors"
                            style={
                              page === item
                                ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)", color: "#fff" }
                                : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "var(--color-text-main)" }
                            }
                          >
                            {item}
                          </button>
                        )
                      )}

                    {/* Next */}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="flex items-center justify-center size-9 rounded-lg border border-gray-200 bg-white text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "var(--color-text-main)" }}
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                )}

                {/* Page info */}
                {totalPages > 1 && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Trang {page} / {totalPages} · {totalCount} sản phẩm
                  </p>
                )}
              </>
            )}
          </div>
        </div>
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  )
}
