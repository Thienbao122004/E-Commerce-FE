import type {
  OrderListResponse,
  OrderDetailResponse,
  OrderActionResponse,
} from "@/lib/types/order"

const API_BASE = process.env.NEXT_PUBLIC_API_URL 

async function fetchJson<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
    ...options,
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* empty */
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}


export function fetchOrders(
  token: string,
  params: {
    page?: number
    pageSize?: number
    status?: number | null
    search?: string | null
  } = {}
) {
  const qp = new URLSearchParams()
  if (params.page) qp.set("page", String(params.page))
  if (params.pageSize) qp.set("pageSize", String(params.pageSize))
  if (params.status !== null && params.status !== undefined)
    qp.set("status", String(params.status))
  if (params.search) qp.set("search", params.search)
  const qs = qp.toString()
  return fetchJson<OrderListResponse>(
    `/api/admin/orders${qs ? `?${qs}` : ""}`,
    token
  )
}

export function fetchOrderById(token: string, orderId: string) {
  return fetchJson<OrderDetailResponse>(`/api/admin/orders/${orderId}`, token)
}

export function updateOrderStatus(
  token: string,
  orderId: string,
  newStatus: number,
  reason?: string
) {
  return fetchJson<OrderActionResponse>(`/api/admin/orders/${orderId}/status`, token, {
    method: "PUT",
    body: JSON.stringify({ newStatus, reason }),
  })
}
