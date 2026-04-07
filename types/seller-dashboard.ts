// ====== Shop Info ======
export type SellerShopInfo = {
  id: string
  shopCode: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  status: number
  verificationStatus: number
  createdAt: string
}

export type SellerShopResponse = {
  success: boolean
  data?: SellerShopInfo
  message?: string
}

export type UpdateShopPayload = {
  name?: string
  description?: string
  logoUrl?: string
}

// ====== Wallet ======
export type SellerWallet = {
  id: string
  availableBalance: number
  /** Tiền tạm giữ sau thanh toán; giải ngân khi đơn hoàn thành */
  heldBalance?: number
  /** Yêu cầu rút đang chờ admin duyệt */
  pendingBalance: number
  totalEarnings: number
  totalWithdrawn: number
  /** Hoàn tác do hủy/hoàn đơn (sau khi đã quyết toán) */
  totalRefunded?: number
  updatedAt: string
}

export type SellerWalletResponse = {
  success: boolean
  data?: SellerWallet
  message?: string
}

// ====== Products (for dashboard) ======
export type SellerProductImage = {
  id: string
  imageUrl: string
  displayOrder: number
}

export type SellerProduct = {
  id: string
  productCode: string
  shopId: string
  categoryId: number | null
  categoryName: string | null
  name: string
  description: string | null
  basePrice: number
  currency: string
  status: number
  createdAt: string
  updatedAt: string
  images: SellerProductImage[] | null
  totalStock: number | null
}

export type SellerProductsResponse = {
  success: boolean
  data?: SellerProduct[]
  totalCount?: number
  message?: string
}

// ====== Orders (for dashboard) ======
export type SellerOrderItem = {
  id: string
  productId: string
  productName: string
  productThumbnailUrl?: string | null
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type SellerOrder = {
  id: string
  orderCode?: string
  customerId: string
  customerName: string | null
  customerEmail?: string | null
  customerAvatarUrl?: string | null
  customerPhone: string | null
  totalAmount: number
  status: number
  shippingAddress: string | null
  providerShippingFee: number
  shippingProvider: string | null
  shippingServiceId: string | null
  trackingCode: string | null
  estimatedDeliveryDate: string | null
  actualDeliveryDate: string | null
  createdAt: string
  items: SellerOrderItem[] | null
}

export type SellerOrdersResponse = {
  success: boolean
  data?: SellerOrder[]
  message?: string
}

export type SellerDashboardStats = {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  categoriesCount: number
  activeProducts: number
}

export const OrderStatus = {
  PendingPayment: 0,
  Confirmed: 2,
  Processing: 3,
  Shipping: 4,
  Delivered: 5,
  Completed: 6,
  Cancelled: 7,
  Refunded: 8,
} as const

export const OrderStatusLabels: Record<number, string> = {
  [OrderStatus.PendingPayment]: "Chờ thanh toán",
  [OrderStatus.Confirmed]: "Đã xác nhận",
  [OrderStatus.Processing]: "Đang chuẩn bị",
  [OrderStatus.Shipping]: "Đang giao hàng",
  [OrderStatus.Delivered]: "Đã giao hàng",
  [OrderStatus.Completed]: "Hoàn thành",
  [OrderStatus.Cancelled]: "Đã hủy",
  [OrderStatus.Refunded]: "Đã hoàn tiền",
}

// ====== Product Status ======
export const ProductStatus = {
  Draft: 0,
  Active: 1,
  Hidden: 2,
  Deleted: 3,
} as const

// ====== Product Variant ======
export type SellerProductVariant = {
  id: string
  variantName: string
  sku: string | null
  price: number | null
  isActive: boolean
  stock: number | null
  attributes: string | null
}

// ====== Product Detail (single fetch) ======
export type SellerProductDetail = SellerProduct & {
  variants: SellerProductVariant[] | null
}

export type SellerProductDetailResponse = {
  success: boolean
  data?: SellerProductDetail
  message?: string
}

// ====== Order Detail (single fetch) ======
export type SellerOrderDetail = SellerOrder & {}

export type SellerOrderDetailResponse = {
  success: boolean
  data?: SellerOrderDetail
  message?: string
}

// ====== Withdrawals ======
export type WithdrawalRecord = {
  id: string
  amount: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  status: number
  note: string | null
  createdAt: string
  processedAt: string | null
}

export type WithdrawalsResponse = {
  success: boolean
  data?: WithdrawalRecord[]
  message?: string
  totalCount?: number
  page?: number
  pageSize?: number
}

export type CreateWithdrawalPayload = {
  amount: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
}

// ====== Create / Update DTOs ======
export type SellerProductVariantPayload = {
  variantName: string
  sku?: string
  price?: number
  quantity: number
  attributes?: string
}

export type CreateSellerProductPayload = {
  categoryId?: number
  name: string
  description?: string
  basePrice: number
  currency?: string
  /** Tồn kho khi không gửi `variants` (một SKU duy nhất). */
  quantity?: number
  variants?: SellerProductVariantPayload[]
  imageUrls?: string[]
  tagIds?: number[]
  materialIds?: number[]
}

export type AddProductVariantResponse = {
  success: boolean
  message?: string
  data?: SellerProductVariant
}

export type UpdateSellerProductPayload = {
  categoryId?: number
  name?: string
  description?: string
  basePrice?: number
  status?: number
  imageUrls?: string[]
}

export type UpdateInventoryPayload = {
  variantId?: string
  quantity: number
}

export type UpdateSellerOrderStatusPayload = {
  status: number
  note?: string
  trackingCode?: string
}

// ====== Product reviews (seller) ======
export type SellerProductReviewItem = {
  id: string
  productId: string
  productName: string
  productThumbnailUrl: string | null
  buyerName: string | null
  rating: number
  comment: string | null
  createdAt: string
  imageUrls: string[]
}

export type SellerProductReviewsData = {
  reviews: SellerProductReviewItem[]
  totalCount: number
  page: number
  pageSize: number
  averageRating: number
  /** Số lượng theo sao: [5★, 4★, 3★, 2★, 1★] */
  ratingDistribution: number[]
  pendingReplyCount: number
}

export type SellerProductReviewsResponse = {
  success: boolean
  data?: SellerProductReviewsData
  message?: string
}
