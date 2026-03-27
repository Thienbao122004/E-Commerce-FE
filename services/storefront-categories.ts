const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

export interface StorefrontCategory {
  id: number
  parentId: number | null
  code: string
  name: string
  slug: string
  level: number
  productCount: number
  image?: string
  subcategories: StorefrontCategory[]
}

export interface StorefrontCategoryListResponse {
  success: boolean
  message?: string | null
  categories: StorefrontCategory[]
  totalCount: number
  page: number
  pageSize: number
}

export interface StorefrontCategoryTreeResponse {
  success: boolean
  message?: string | null
  tree: StorefrontCategory[]
}

export interface StorefrontCategoryDetailResponse {
  success: boolean
  message?: string | null
  category?: StorefrontCategory
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

/** GET /api/categories — danh sách danh mục đang hoạt động, không cần xác thực */
export function getCategories(params: {
  page?: number
  pageSize?: number
  level?: number
} = {}): Promise<StorefrontCategoryListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.level !== undefined) qs.set("level", String(params.level))
  const query = qs.toString()
  return fetchJson<StorefrontCategoryListResponse>(
    `/api/categories${query ? `?${query}` : ""}`
  )
}

/** GET /api/categories/tree — cây danh mục đầy đủ, không cần xác thực */
export function getCategoryTree(): Promise<StorefrontCategoryTreeResponse> {
  return fetchJson<StorefrontCategoryTreeResponse>(`/api/categories/tree`)
}

/** GET /api/categories/:id — chi tiết danh mục kèm danh mục con, không cần xác thực */
export function getCategoryById(
  categoryId: number
): Promise<StorefrontCategoryDetailResponse> {
  return fetchJson<StorefrontCategoryDetailResponse>(`/api/categories/${categoryId}`)
}
