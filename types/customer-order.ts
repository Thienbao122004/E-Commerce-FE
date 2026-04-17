export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  thumbnailUrl?: string
  hasReviewedByUser?: boolean
}

export interface OrderSummary {
  id: string
  orderCode?: string
  paymentProvider?: string | null
  cancelReason?: string | null
  providerShippingFee?: number | null
  shippingFee?: number | null
  shopId: string
  shopSlug?: string
  shopName: string
  totalAmount: number
  status: number
  statusName: string
  createdAt: string
  updatedAt?: string
  items: OrderItem[]
}

export interface OrderListResponse {
  success: boolean
  orders: OrderSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export interface OrderDetail extends OrderSummary {
  shipFullName?: string
  shipPhone?: string
  shipAddress?: string
}

export interface OrderDetailResponse {
  success: boolean
  message?: string
  order?: OrderDetail
}

export interface ConfirmOrderResponse {
  success: boolean
  message: string
  orderId: string
  newStatus: number
  newStatusName: string
  updatedAt: string
}

export interface CancelOrderRequest {
  reason?: string
}
