const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5153"

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

export interface FavoriteIdsResponse {
  success: boolean
  productIds: string[]
}

export interface ToggleFavoriteResponse {
  success: boolean
  isFavorited: boolean
}

export function getFavoriteIds(token: string): Promise<FavoriteIdsResponse> {
  return fetchJson<FavoriteIdsResponse>("/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function toggleFavorite(productId: string, token: string): Promise<ToggleFavoriteResponse> {
  return fetchJson<ToggleFavoriteResponse>(`/api/favorites/${productId}/toggle`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}
