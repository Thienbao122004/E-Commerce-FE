const API_BASE = process.env.NEXT_PUBLIC_API_URL

async function fetchJson<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface MaterialDto {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  productCount: number
}

export interface MaterialListResponse {
  success: boolean
  materials: MaterialDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface MaterialResponse {
  success: boolean
  message?: string
  material?: MaterialDto
}

export function fetchAdminMaterials(
  token: string,
  page: number,
  pageSize: number,
  search?: string,
  isActive?: boolean
): Promise<MaterialListResponse> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) q.set("search", search)
  if (isActive !== undefined) q.set("isActive", String(isActive))
  return fetchJson<MaterialListResponse>(`/api/admin/materials?${q}`, token)
}

export function createMaterial(
  token: string,
  data: { name: string; description?: string | null }
): Promise<MaterialResponse> {
  return fetchJson<MaterialResponse>("/api/admin/materials", token, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateMaterial(
  token: string,
  materialId: string,
  data: { name: string; description?: string | null }
): Promise<MaterialResponse> {
  return fetchJson<MaterialResponse>(`/api/admin/materials/${materialId}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export function toggleMaterialActive(
  token: string,
  materialId: string
): Promise<MaterialResponse> {
  return fetchJson<MaterialResponse>(`/api/admin/materials/${materialId}/toggle-active`, token, {
    method: "POST",
  })
}

export function deleteMaterial(
  token: string,
  materialId: string
): Promise<MaterialResponse> {
  return fetchJson<MaterialResponse>(`/api/admin/materials/${materialId}`, token, {
    method: "DELETE",
  })
}
