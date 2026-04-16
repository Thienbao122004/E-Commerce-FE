export interface FavoriteIdsResponse {
  success: boolean
  productIds: string[]
}

export interface ToggleFavoriteResponse {
  success: boolean
  isFavorited: boolean
}
