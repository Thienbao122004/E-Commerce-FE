import { api } from '@/lib/api-client'
import type {
  ProductReviewListResponse,
  ProductReviewStatsResponse,
  CreateProductReviewRequest,
  CreateProductReviewResponse,
} from '@/types/product-review'

export type {
  ProductReviewListResponse,
  ProductReviewStatsDto,
  ProductReviewStatsResponse,
  CreateProductReviewRequest,
  ProductReviewDto,
  CreateProductReviewResponse,
} from '@/types/product-review'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5153'

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

export const reviewsService = {
  createProductReview: (data: CreateProductReviewRequest) =>
    api.post<CreateProductReviewResponse>('/api/reviews/products', data),
}
