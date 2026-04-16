import { api } from "@/lib/api-client"
import type { AdminOrderListResponse } from "@/types/admin-order"

export type { AdminOrderRow, AdminOrderListResponse } from "@/types/admin-order"

export function fetchAdminOrders(
  page = 1,
  pageSize = 10,
  customerId?: string
): Promise<AdminOrderListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (customerId) params.set("customerId", customerId)
  return api.get<AdminOrderListResponse>(`/api/admin/orders?${params}`)
}
