import { api } from "@/lib/api-client"
import type { FavoriteIdsResponse, ToggleFavoriteResponse } from "@/types/favorite"

export type { FavoriteIdsResponse, ToggleFavoriteResponse } from "@/types/favorite"

export function getFavoriteIds(): Promise<FavoriteIdsResponse> {
  return api.get<FavoriteIdsResponse>("/api/favorites")
}

export function toggleFavorite(productId: string): Promise<ToggleFavoriteResponse> {
  return api.post<ToggleFavoriteResponse>(`/api/favorites/${productId}/toggle`)
}
