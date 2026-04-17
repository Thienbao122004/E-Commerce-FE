import { api } from '@/lib/api-client'
import type {
  OrderListResponse,
  OrderDetailResponse,
  ConfirmOrderResponse,
  CancelOrderRequest,
} from '@/types/customer-order'

export type {
  OrderItem,
  OrderSummary,
  OrderListResponse,
  OrderDetail,
  OrderDetailResponse,
  ConfirmOrderResponse,
  CancelOrderRequest,
} from '@/types/customer-order'

export const ordersService = {
  getMyOrders: (page = 1, pageSize = 50, status?: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status !== undefined) params.set('status', String(status))
    return api.get<OrderListResponse>(`/api/orders?${params}`)
  },

  getOrderById: (orderId: string) =>
    api.get<OrderDetailResponse>(`/api/orders/${orderId}`),

  confirmOrder: (orderId: string) =>
    api.post<ConfirmOrderResponse>(`/api/orders/${orderId}/confirm`),

  cancelOrder: (orderId: string, payload?: CancelOrderRequest) =>
    api.post<{ success: boolean; message: string }>(`/api/orders/${orderId}/cancel`, payload ?? {}),

  cancelPendingOrder: (orderId: string, payload?: CancelOrderRequest) =>
    api.post<{ success: boolean; message: string }>(`/api/orders/${orderId}/cancel-pending`, payload ?? {}),
}
