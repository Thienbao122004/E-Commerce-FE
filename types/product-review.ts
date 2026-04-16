export interface ProductReviewListResponse {
  success: boolean
  message?: string
  reviews: ProductReviewDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ProductReviewStatsDto {
  total: number
  count5: number
  count4: number
  count3: number
  count2: number
  count1: number
  withComment: number
  withImage: number
}

export interface ProductReviewStatsResponse {
  success: boolean
  data: ProductReviewStatsDto
}

export interface CreateProductReviewRequest {
  orderId: string
  productId: string
  rating: number
  comment?: string
  imageUrls?: string[]
}

export interface ProductReviewDto {
  id: string
  productId: string
  userId: string
  userName?: string
  rating: number
  comment?: string
  createdAt: string
  imageUrls: string[]
  sellerReply?: string | null
  helpfulCount?: number
}

export interface CreateProductReviewResponse {
  success: boolean
  message: string
  data?: ProductReviewDto
}
