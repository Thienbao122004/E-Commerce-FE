const API = process.env.NEXT_PUBLIC_API_URL

export type AdminOrderRow = {
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
  shipFullName?: string | null
  shipPhone?: string | null
  shipAddress?: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type AdminOrderListResponse = {
  success: boolean
  message?: string | null
  orders: AdminOrderRow[]
  totalCount: number
  page: number
  pageSize: number
}

export async function fetchAdminOrders(
  token: string,
  page = 1,
  pageSize = 10,
  customerId?: string
): Promise<AdminOrderListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (customerId) params.set("customerId", customerId)

  const res = await fetch(`${API}/api/admin/orders?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải đơn hàng")
  return res.json()
}
