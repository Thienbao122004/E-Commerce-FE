const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

export interface ProductVariantStorefront {
  id: string
  variantName: string
  attributes?: string | null
  price: number | null
  isActive: boolean
  stockQuantity: number
}

/** Dùng cho danh sách sản phẩm */
export interface StorefrontProduct {
  id: string
  slug: string
  name: string
  shopId: string
  shopName: string
  shopSlug: string
  basePrice: number
  currency: string
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  imageUrls: string[]
  createdAt: string
  soldCount: number
}

/** Dùng cho trang chi tiết sản phẩm */
export interface StorefrontProductDetail extends StorefrontProduct {
  description: string | null
  averageRating: number
  reviewCount: number
  variants: ProductVariantStorefront[]
  totalStock: number
}

export interface StorefrontProductsResponse {
  success: boolean
  message?: string | null
  products: StorefrontProduct[]
  totalCount: number
  page: number
  pageSize: number
}

export interface StorefrontProductDetailResponse {
  success: boolean
  message?: string | null
  product?: StorefrontProductDetail
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getProducts(params: {
  page?: number
  pageSize?: number
  categoryId?: number
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | "best_seller"
} = {}): Promise<StorefrontProductsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.categoryId !== undefined) qs.set("categoryId", String(params.categoryId))
  if (params.search) qs.set("search", params.search)
  if (params.minPrice !== undefined) qs.set("minPrice", String(params.minPrice))
  if (params.maxPrice !== undefined) qs.set("maxPrice", String(params.maxPrice))
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  const query = qs.toString()
  return fetchJson<StorefrontProductsResponse>(
    `/api/products${query ? `?${query}` : ""}`
  )
}

export function getProductById(
  productId: string
): Promise<StorefrontProductDetailResponse> {
  return fetchJson<StorefrontProductDetailResponse>(`/api/products/${productId}`)
}

export function getProductBySlug(
  slug: string
): Promise<StorefrontProductDetailResponse> {
  return fetchJson<StorefrontProductDetailResponse>(`/api/products/${slug}`)
}
