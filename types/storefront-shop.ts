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

export interface ShopCategoryDto {
  id: number
  name: string
  slug: string | null
  productCount: number
}

export interface ShopCategoriesApiResponse {
  success: boolean
  categories: ShopCategoryDto[]
}
