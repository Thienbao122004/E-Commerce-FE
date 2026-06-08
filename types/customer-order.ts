/** Bước trên timeline trạng thái (API: statusTimeline, camelCase) */
export type OrderStatusStep = {
  code: string
  displayName: string
  value: number
  state: string
  reachedAt?: string | null
}

/** Ảnh bằng chứng giao hàng kèm trạng thái đơn tại thời điểm upload */
export type DeliveryProofEntry = {
  url: string
  /** Giá trị OrderStatus: 3=ĐangChuẩnBị, 4=ĐangGiao, 5=ĐãGiao, ... */
  orderStatus: number
  uploadedAt?: string
}

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
  statusTimeline?: OrderStatusStep[] | null
  estimatedDeliveryDate?: string | null
  actualDeliveryDate?: string | null
  trackingCode?: string | null
  shippingProvider?: string | null
  /** URL ảnh bằng chứng giao hàng từ shipper, kèm trạng thái đơn tại thời điểm chụp */
  deliveryProofUrls?: DeliveryProofEntry[] | null
  /** Null = không có yêu cầu hủy đang chờ. Có giá trị = đơn đang chờ shop duyệt hủy. */
  cancelRequestedAt?: string | null
  /** Hạn shop phải phản hồi (= cancelRequestedAt + 24h). Quá hạn → tự động hủy. */
  cancelRequestDeadline?: string | null
}

export interface CancelOrderResponse {
  success: boolean
  message: string
  /** true = hủy ngay; false = yêu cầu đã gửi đến shop, chờ duyệt */
  cancelledImmediately?: boolean
  cancelRequestedAt?: string | null
  cancelRequestDeadline?: string | null
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
