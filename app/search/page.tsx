"use client"

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getProducts, type StorefrontProduct } from "@/services/storefront-products"
import { getCategories, type StorefrontCategory } from "@/services/storefront-categories"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"

const HeaderUser = dynamic(
  () => import("@/components/layout/header-user").then((m) => m.HeaderUser),
  { ssr: false, loading: () => <div className="size-10 shrink-0" /> }
)

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price)
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

/* ─── Search Box with Suggestions ─── */
function SearchBox({ initialValue }: { initialValue: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Array<{
    id: string
    name: string
    shopName: string
    imageUrl?: string
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await getProducts({ search: value.trim(), pageSize: 8 })
        if (res.success) {
          const dedupedByName = new Map<string, { id: string; name: string; shopName: string; imageUrl?: string }>()
          for (const p of res.products) {
            if (!dedupedByName.has(p.name)) {
              dedupedByName.set(p.name, {
                id: p.id,
                name: p.name,
                shopName: p.shopName,
                imageUrl: p.imageUrls?.[0],
              })
            }
          }
          setSuggestions(Array.from(dedupedByName.values()).slice(0, 6))
        }
      } catch { }
      finally { setLoadingSuggestions(false) }
    }, 300)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = (term: string) => {
    setShowSuggestions(false)
    if (!term.trim()) {
      router.push('/search')
      return
    }
    router.push(`/search?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-4">
      <div
        className="flex w-full items-center rounded-lg overflow-hidden border transition-colors focus-within:border-[var(--color-primary)]"
        style={{ backgroundColor: "#f0ebe4", borderColor: showSuggestions && suggestions.length > 0 ? "var(--color-primary)" : "transparent" }}
      >
        <div className="flex items-center pl-3" style={{ color: "var(--color-text-secondary)" }}>
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(value) }}
          placeholder="Tìm kiếm sản phẩm, shop, thương hiệu..."
          className="w-full bg-transparent border-none py-2.5 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400"
          style={{ color: "var(--color-text-main)" }}
        />
        {value && (
          <button
            onClick={() => { setValue(""); setSuggestions([]); setShowSuggestions(false) }}
            className="pr-2 text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
        <button
          onClick={() => handleSearch(value)}
          className="px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Tìm
        </button>
      </div>

      {showSuggestions && (value.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {loadingSuggestions ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <span className="size-3.5 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
              Đang tìm...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((item) => (
                <button
                  key={`${item.id}-${item.name}`}
                  onMouseDown={() => handleSearch(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f5f1] transition-colors text-left"
                >
                  <div className="size-9 rounded-md bg-gray-100 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-base text-gray-400">search</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ color: "var(--color-text-main)" }}>{item.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.shopName}</p>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400">Không tìm thấy gợi ý phù hợp</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Search Page Content ─── */
function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") ?? ""
  const categorySlug = searchParams.get("category") ?? ""
  const { isFavorited, toggle: toggleFavorite } = useFavorites()

  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)
  const [initialCategorySet, setInitialCategorySet] = useState(false)

  const PAGE_SIZE = 110
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const mainRef = useRef<HTMLDivElement>(null)

  const loadProducts = useCallback(async (
    q: string,
    p: number,
    sort: typeof sortBy,
    catId: number | undefined,
  ) => {
    setLoading(true)
    try {
      const res = await getProducts({ search: q, page: p, pageSize: PAGE_SIZE, sortBy: sort, categoryId: catId })
      if (res.success) {
        setProducts(res.products)
        setTotalCount(res.totalCount)
      }
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setPage(1)
    setProducts([])
    loadProducts(query, 1, sortBy, selectedCategory)
  }, [query, sortBy, selectedCategory, loadProducts])

  useEffect(() => {
    getCategories({ pageSize: 20, level: 1 }).then((res) => {
      if (res.success) {
        setCategories(res.categories)
        
        if (categorySlug && !initialCategorySet) {
          const matchedCategory = res.categories.find(
            (cat) => cat.slug === categorySlug || cat.code === categorySlug || String(cat.id) === categorySlug
          )
          if (matchedCategory) {
            setSelectedCategory(matchedCategory.id)
          }
          setInitialCategorySet(true)
        }
      }
    }).catch(() => { })
  }, [categorySlug, initialCategorySet])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    loadProducts(query, newPage, sortBy, selectedCategory)
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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

          <SearchBox initialValue={query} />

          <div className="flex items-center gap-2 shrink-0">
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

      <main ref={mainRef} className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6">
        {/* Breadcrumb + title */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span style={{ color: "var(--color-text-main)" }}>Tìm kiếm</span>
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
          {/* Sidebar filter */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--color-text-main)" }}>Danh mục</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                      selectedCategory === undefined
                        ? "font-bold text-[var(--color-primary)] bg-[#fdf6ee]"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tất cả
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                        selectedCategory === cat.id
                          ? "font-bold text-[var(--color-primary)] bg-[#fdf6ee]"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sortBy === opt.value
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
                          <h3 className="text-sm line-clamp-2 flex-1" style={{ color: "var(--color-text-main)" }}>
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
