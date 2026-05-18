import { api } from "@/lib/api-client"
import type { TagListResponse, TagResponse } from "@/types/tag"

// ---------- List ----------
export function fetchTags(
  page = 1,
  pageSize = 20,
  search?: string | null,
  isActive?: boolean
): Promise<TagListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search) params.set("search", search)
  if (isActive !== undefined) params.set("isActive", String(isActive))
  return api.get<TagListResponse>(`/api/admin/tags?${params}`)
}

// ---------- Detail ----------
export function fetchTagById(id: number): Promise<TagResponse> {
  return api.get<TagResponse>(`/api/admin/tags/${id}`)
}

// ---------- Create ----------
export function createTag(name: string): Promise<TagResponse> {
  return api.post<TagResponse>("/api/admin/tags", { name })
}

// ---------- Update ----------
export function updateTag(id: number, name: string, isActive?: boolean): Promise<TagResponse> {
  return api.put<TagResponse>(`/api/admin/tags/${id}`, { name, ...(isActive !== undefined && { isActive }) })
}

export function toggleTagActive(id: number, isActive: boolean): Promise<TagResponse> {
  return api.put<TagResponse>(`/api/admin/tags/${id}`, { isActive })
}

// ---------- Delete ----------
export function deleteTag(id: number): Promise<TagResponse> {
  return api.delete<TagResponse>(`/api/admin/tags/${id}`)
}
