import { api } from "@/lib/api-client"
import type { MaterialListResponse, MaterialResponse } from "@/types/material"

export type { MaterialDto, MaterialListResponse, MaterialResponse } from "@/types/material"

export function fetchAdminMaterials(
  page: number,
  pageSize: number,
  search?: string,
  isActive?: boolean
): Promise<MaterialListResponse> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) q.set("search", search)
  if (isActive !== undefined) q.set("isActive", String(isActive))
  return api.get<MaterialListResponse>(`/api/admin/materials?${q}`)
}

export function createMaterial(
  data: { name: string; description?: string | null }
): Promise<MaterialResponse> {
  return api.post<MaterialResponse>("/api/admin/materials", data)
}

export function updateMaterial(
  materialId: string,
  data: { name: string; description?: string | null }
): Promise<MaterialResponse> {
  return api.put<MaterialResponse>(`/api/admin/materials/${materialId}`, data)
}

export function toggleMaterialActive(
  materialId: string
): Promise<MaterialResponse> {
  return api.post<MaterialResponse>(`/api/admin/materials/${materialId}/toggle-active`)
}

export function deleteMaterial(
  materialId: string
): Promise<MaterialResponse> {
  return api.delete<MaterialResponse>(`/api/admin/materials/${materialId}`)
}
