
export type ProductModeration = {
  id: string
  name: string
  shopId: string
  shopName: string
  status: number
  statusName: string
  basePrice: number
  categoryId: number | null
  categoryName: string | null
  createdAt: string
  updatedAt: string
  imageUrls: string[]
}

export type ProductListResponse = {
  success: boolean
  message?: string | null
  products: ProductModeration[]
  totalCount: number
  page: number
  pageSize: number
}

export type ProductDetailResponse = {
  success: boolean
  message?: string | null
  product?: ProductModeration
}

export type ProductActionResponse = {
  success: boolean
  message?: string | null
  product?: ProductModeration
}

export const ProductStatus = {
  Draft: 0,
  Active: 1,
  Hidden: 2,
  OutOfStock: 3,
  Removed: 4,
} as const

export const ProductStatusLabels: Record<number, string> = {
  [ProductStatus.Draft]: "Nháp",
  [ProductStatus.Active]: "Đang bán",
  [ProductStatus.Hidden]: "Đã ẩn",
  [ProductStatus.OutOfStock]: "Hết hàng",
  [ProductStatus.Removed]: "Đã gỡ",
}

export const ProductStatusColors: Record<number, string> = {
  [ProductStatus.Draft]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  [ProductStatus.Active]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [ProductStatus.Hidden]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  [ProductStatus.OutOfStock]: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  [ProductStatus.Removed]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}
