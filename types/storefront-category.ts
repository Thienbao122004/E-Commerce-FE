export interface StorefrontCategory {
  id: number
  parentId: number | null
  code: string
  name: string
  slug: string
  level: number
  productCount: number
  image?: string
  subcategories: StorefrontCategory[]
}

export interface StorefrontCategoryListResponse {
  success: boolean
  message?: string | null
  categories: StorefrontCategory[]
  totalCount: number
  page: number
  pageSize: number
}

export interface StorefrontCategoryTreeResponse {
  success: boolean
  message?: string | null
  tree: StorefrontCategory[]
}

export interface StorefrontCategoryDetailResponse {
  success: boolean
  message?: string | null
  category?: StorefrontCategory
}
