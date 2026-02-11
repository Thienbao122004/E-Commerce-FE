// ---------- Order Status Enum ----------
export const OrderStatus = {
  PendingPayment: 0,
  PendingConfirmation: 1,
  Confirmed: 2,
  Processing: 3,
  Shipping: 4,
  Delivered: 5,
  Completed: 6,
  Cancelled: 7,
  Refunded: 8,
} as const

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderStatusLabels: Record<number, string> = {
  [OrderStatus.PendingPayment]: "Chờ thanh toán",
  [OrderStatus.PendingConfirmation]: "Chờ xác nhận",
  [OrderStatus.Confirmed]: "Đã xác nhận",
  [OrderStatus.Processing]: "Đang chuẩn bị",
  [OrderStatus.Shipping]: "Đang giao",
  [OrderStatus.Delivered]: "Đã giao",
  [OrderStatus.Completed]: "Hoàn thành",
  [OrderStatus.Cancelled]: "Đã hủy",
  [OrderStatus.Refunded]: "Đã hoàn tiền",
}

export const OrderStatusColors: Record<number, string> = {
  [OrderStatus.PendingPayment]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  [OrderStatus.PendingConfirmation]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  [OrderStatus.Confirmed]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [OrderStatus.Processing]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [OrderStatus.Shipping]:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  [OrderStatus.Delivered]:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  [OrderStatus.Completed]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [OrderStatus.Cancelled]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [OrderStatus.Refunded]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

export const ValidOrderTransitions: Record<number, number[]> = {
  [OrderStatus.PendingPayment]: [OrderStatus.PendingConfirmation, OrderStatus.Cancelled],
  [OrderStatus.PendingConfirmation]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
  [OrderStatus.Processing]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [OrderStatus.Completed, OrderStatus.Refunded],
  [OrderStatus.Completed]: [],     
  [OrderStatus.Cancelled]: [],     
  [OrderStatus.Refunded]: [],     
}

// Shopee-style happy-path steps for the visual stepper
export const OrderStatusSteps = [
  { status: OrderStatus.PendingConfirmation, label: "Chờ xác nhận" },
  { status: OrderStatus.Confirmed, label: "Đã xác nhận" },
  { status: OrderStatus.Processing, label: "Đang chuẩn bị" },
  { status: OrderStatus.Shipping, label: "Đang giao" },
  { status: OrderStatus.Delivered, label: "Đã giao" },
  { status: OrderStatus.Completed, label: "Hoàn thành" },
]

export function getStatusStepIndex(status: number): number {
  // PendingPayment maps to step 0 (before Chờ xác nhận)
  if (status === OrderStatus.PendingPayment) return -1
  // Cancelled / Refunded are off the normal track
  if (status === OrderStatus.Cancelled || status === OrderStatus.Refunded) return -2
  return OrderStatusSteps.findIndex((s) => s.status === status)
}

export type OrderItem = {
  id: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type AdminOrder = {
  id: string
  customerId: string
  customerName: string
  customerEmail: string | null
  shopId: string
  shopName: string
  status: number
  statusName: string
  subtotal: number
  shippingFee: number
  total: number
  shipFullName: string | null
  shipPhone: string | null
  shipAddress: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type AdminOrderDetail = AdminOrder & {
  items: OrderItem[]
}

export type OrderListResponse = {
  success: boolean
  message?: string | null
  orders: AdminOrder[]
  totalCount: number
  page: number
  pageSize: number
}

export type OrderDetailResponse = {
  success: boolean
  message?: string | null
  order?: AdminOrderDetail
}

export type OrderActionResponse = {
  success: boolean
  message?: string | null
  order?: AdminOrderDetail
}
