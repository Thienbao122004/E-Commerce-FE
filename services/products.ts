import { api } from "@/lib/api-client"
import type {
  ProductListResponse,
  ProductDetailResponse,
  ProductActionResponse,
} from "@/types/product"

/** GET /api/admin/products — paginated, filterable list */
export function fetchProducts(
  params: {
    page?: number
    pageSize?: number
    status?: number | null
    shopId?: string | null
    search?: string | null
  } = {}
): Promise<ProductListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.status !== undefined && params.status !== null)
    qs.set("status", String(params.status))
  if (params.shopId) qs.set("shopId", params.shopId)
  if (params.search) qs.set("search", params.search)

  const query = qs.toString()
  return api.get<ProductListResponse>(`/api/admin/products${query ? `?${query}` : ""}`)
}

/** GET /api/admin/products/:id */
export function fetchProductById(productId: string): Promise<ProductDetailResponse> {
  return api.get<ProductDetailResponse>(`/api/admin/products/${productId}`)
}

/** POST /api/admin/products/:id/hide */
export function hideProduct(productId: string, reason: string): Promise<ProductActionResponse> {
  return api.post<ProductActionResponse>(
    `/api/admin/products/${productId}/hide`,
    { reason }
  )
}

/** POST /api/admin/products/:id/unhide */
export function unhideProduct(productId: string): Promise<ProductActionResponse> {
  return api.post<ProductActionResponse>(`/api/admin/products/${productId}/unhide`, {})
}

/** POST /api/admin/products/:id/remove */
export function removeProduct(productId: string, reason: string): Promise<ProductActionResponse> {
  return api.post<ProductActionResponse>(
    `/api/admin/products/${productId}/remove`,
    { reason }
  )
}
