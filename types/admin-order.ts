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
