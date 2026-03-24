const API_BASE = process.env.NEXT_PUBLIC_API_URL


export interface ShopPublicDto {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  productCount: number
  followerCount: number
  averageRating: number
  reviewCount: number
  createdAt: string
  isFollowing: boolean
}

export interface ShopPublicDetailResponse {
  success: boolean
  message?: string | null
  shop?: ShopPublicDto
}

import type { StorefrontProductsResponse } from "./storefront-products"

export interface ShopCategoryDto {
  id: number
  name: string
  slug: string | null
  productCount: number
}


async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getShopBySlug(slug: string, token?: string): Promise<ShopPublicDetailResponse> {
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetchJson<ShopPublicDetailResponse>(`/api/shops/${slug}`, { headers })
}

export function getShopProducts(
  shopId: string,
  params: { page?: number; pageSize?: number; sortBy?: string; categoryId?: number | null } = {}
): Promise<StorefrontProductsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.categoryId) qs.set("categoryId", String(params.categoryId))
  const query = qs.toString()
  return fetchJson<StorefrontProductsResponse>(`/api/shops/${shopId}/products${query ? `?${query}` : ""}`)
}

export function getShopCategories(shopId: string): Promise<{ success: boolean; categories: ShopCategoryDto[] }> {
  return fetchJson<{ success: boolean; categories: ShopCategoryDto[] }>(`/api/shops/${shopId}/categories`)
}

export async function followShop(token: string, shopId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shops/${shopId}/follow`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi theo dõi shop")
}

export async function unfollowShop(token: string, shopId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shops/${shopId}/follow`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi hủy theo dõi shop")
}
