const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

import type {
  StorefrontProductsResponse,
  StorefrontProductDetailResponse,
} from "@/types/storefront-product"

export type {
  ProductVariantStorefront,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontProductsResponse,
  StorefrontProductDetailResponse,
} from "@/types/storefront-product"

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
  minRating?: number
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | "best_seller"
} = {}): Promise<StorefrontProductsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.categoryId !== undefined) qs.set("categoryId", String(params.categoryId))
  if (params.search) qs.set("search", params.search)
  if (params.minPrice !== undefined) qs.set("minPrice", String(params.minPrice))
  if (params.maxPrice !== undefined) qs.set("maxPrice", String(params.maxPrice))
  if (params.minRating !== undefined) qs.set("minRating", String(params.minRating))
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
