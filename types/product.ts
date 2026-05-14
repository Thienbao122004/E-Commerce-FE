/** JSON (camelCase) từ API — bản lưu tại thời điểm duyệt trước. */
export type ProductApprovedSnapshot = {
  capturedAtUtc?: string
  name: string
  description?: string | null
  basePrice: number
  categoryId?: number | null
  categoryName?: string | null
  imageUrls: string[]
  tagIds?: number[]
  tagNames: string[]
  materialIds?: string[]
  materialNames: string[]
  baseInventoryQuantity?: number | null
  variants: ProductModerationVariantRow[]
}

export type ProductModerationVariantRow = {
  variantName: string
  sku?: string | null
  price?: number | null
  stock: number
  attributes?: string | null
}

export type ProductLocalMetaModeration = {
  profileId: number
  provinceName: string
  archetypeName: string
  displayNote: string | null
  selectedTraits: string[]
  expectedTraits: string[]
  mismatchWarning?: string | null
}

export type ProductModeration = {
  id: string
  productCode: string
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
  description?: string | null
  /** Bản cũ (lần duyệt trước), để so sánh với bản mới. */
  lastApprovedSnapshotJson?: string | null
  tagNames?: string[]
  materialNames?: string[]
  baseInventoryQuantity?: number | null
  variants?: ProductModerationVariantRow[]
  /** Thông tin Local Brand — hiển thị cho admin khi duyệt */
  localMeta?: ProductLocalMetaModeration | null
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
  /** Chờ admin duyệt (sau khi seller tạo/cập nhật) */
  PendingApproval: 5,
} as const

export const ProductStatusLabels: Record<number, string> = {
  [ProductStatus.Draft]: "Nháp",
  [ProductStatus.Active]: "Đang bán",
  [ProductStatus.Hidden]: "Đã ẩn",
  [ProductStatus.OutOfStock]: "Hết hàng",
  [ProductStatus.Removed]: "Đã gỡ",
  [ProductStatus.PendingApproval]: "Chờ duyệt",
}

export const ProductStatusColors: Record<number, string> = {
  [ProductStatus.Draft]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  [ProductStatus.Active]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [ProductStatus.Hidden]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  [ProductStatus.OutOfStock]: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  [ProductStatus.Removed]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  [ProductStatus.PendingApproval]: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
}
