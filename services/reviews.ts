import { api } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5153'

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

export async function getProductReviewStats(
  productId: string
): Promise<ProductReviewStatsResponse> {
  const res = await fetch(`${API_BASE}/api/reviews/products/${productId}/stats`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.message === 'string' ? body.message : `Lỗi tải thống kê (${res.status})`
    )
  }
  return res.json() as Promise<ProductReviewStatsResponse>
}

/** Đánh giá sản phẩm (công khai, không cần đăng nhập). */
export async function getProductReviews(
  productId: string,
  params?: {
    page?: number
    pageSize?: number
    sortBy?: 'newest' | 'rating' | 'rating_asc'
    rating?: number
    hasComment?: boolean
    hasImage?: boolean
  }
): Promise<ProductReviewListResponse> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.sortBy) qs.set('sortBy', params.sortBy)
  if (params?.rating !== undefined && params.rating >= 1 && params.rating <= 5) {
    qs.set('rating', String(params.rating))
  }
  if (params?.hasComment === true) qs.set('hasComment', 'true')
  if (params?.hasImage === true) qs.set('hasImage', 'true')
  const q = qs.toString()
  const res = await fetch(
    `${API_BASE}/api/reviews/products/${productId}${q ? `?${q}` : ''}`,
    { cache: 'no-store' }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.message === 'string' ? body.message : `Lỗi tải đánh giá (${res.status})`
    )
  }
  return res.json() as Promise<ProductReviewListResponse>
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

export const reviewsService = {
  createProductReview: (data: CreateProductReviewRequest) =>
    api.post<CreateProductReviewResponse>('/api/reviews/products', data),
}
