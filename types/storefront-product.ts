export interface ProductVariantStorefront {
  id: string
  variantName: string
  attributes?: string | null
  price: number | null
  isActive: boolean
  stockQuantity: number
}

export interface StorefrontProduct {
  id: string
  slug: string
  name: string
  shopId: string
  shopName: string
  shopSlug: string
  shopLogoUrl?: string | null
  basePrice: number
  currency: string
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  imageUrls: string[]
  createdAt: string
  soldCount: number
  averageRating?: number
  reviewCount?: number
}

export interface ProductLocalMeta {
  profileId: number
  provinceName: string
  archetypeName: string
  displayNote: string | null
  selectedTraits: string[]
  expectedTraits: string[]
}

export interface StorefrontProductDetail extends StorefrontProduct {
  description: string | null
  averageRating: number
  reviewCount: number
  variants: ProductVariantStorefront[]
  totalStock: number
  tags?: string[]
  materials?: string[]
  localMeta?: ProductLocalMeta | null
}

export interface StorefrontProductsResponse {
  success: boolean
  message?: string | null
  products: StorefrontProduct[]
  totalCount: number
  page: number
  pageSize: number
}

export interface StorefrontProductDetailResponse {
  success: boolean
  message?: string | null
  product?: StorefrontProductDetail
}
