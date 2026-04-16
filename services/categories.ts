import { api } from "@/lib/api-client"
import type {
  CategoryListResponse,
  CategoryResponse,
  CategoryTreeResponse,
  MigrateProductsResponse,
} from "@/types/category"

export function fetchCategories(
  page = 1,
  pageSize = 20,
  level?: number | null,
  isActive?: boolean | null
): Promise<CategoryListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (level !== null && level !== undefined) params.set("level", String(level))
  if (isActive !== null && isActive !== undefined) params.set("isActive", String(isActive))
  return api.get<CategoryListResponse>(`/api/admin/categories?${params}`)
}

export function fetchCategoryTree(): Promise<CategoryTreeResponse> {
  return api.get<CategoryTreeResponse>("/api/admin/categories/tree")
}

export function fetchCategoryById(id: number): Promise<CategoryResponse> {
  return api.get<CategoryResponse>(`/api/admin/categories/${id}`)
}

export function createCategory(
  data: { parentId?: number | null; code: string; name: string }
): Promise<CategoryResponse> {
  return api.post<CategoryResponse>("/api/admin/categories", data)
}

export function updateCategory(
  id: number,
  data: { code?: string; name?: string; parentId?: number | null }
): Promise<CategoryResponse> {
  return api.put<CategoryResponse>(`/api/admin/categories/${id}`, data)
}

export function activateCategory(id: number): Promise<CategoryResponse> {
  return api.post<CategoryResponse>(`/api/admin/categories/${id}/activate`)
}

export function deactivateCategory(id: number, reason?: string): Promise<CategoryResponse> {
  return api.post<CategoryResponse>(`/api/admin/categories/${id}/deactivate`, { reason })
}

export function deleteCategory(id: number): Promise<CategoryResponse> {
  return api.delete<CategoryResponse>(`/api/admin/categories/${id}`)
}

export function migrateProducts(
  fromId: number,
  targetCategoryId: number
): Promise<MigrateProductsResponse> {
  return api.post<MigrateProductsResponse>(
    `/api/admin/categories/${fromId}/migrate-products`,
    { targetCategoryId }
  )
}
