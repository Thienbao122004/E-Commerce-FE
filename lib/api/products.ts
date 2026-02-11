import type {
  ProductListResponse,
  ProductDetailResponse,
  ProductActionResponse,
} from "@/lib/types/product"

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
      const text = await res.text().catch(() => "")
      if (text) message = text
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

/** GET /api/admin/products — paginated, filterable list */
export function fetchProducts(
  token: string,
  params: {
    page?: number
    pageSize?: number
    status?: number | null
    shopId?: string | null
    search?: string | null
  } = {}
) {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  if (params.status !== undefined && params.status !== null)
    qs.set("status", String(params.status))
  if (params.shopId) qs.set("shopId", params.shopId)
  if (params.search) qs.set("search", params.search)

  const query = qs.toString()
  return fetchJson<ProductListResponse>(
    `/api/admin/products${query ? `?${query}` : ""}`,
    token
  )
}

/** GET /api/admin/products/:id */
export function fetchProductById(token: string, productId: string) {
  return fetchJson<ProductDetailResponse>(
    `/api/admin/products/${productId}`,
    token
  )
}

/** POST /api/admin/products/:id/hide */
export function hideProduct(
  token: string,
  productId: string,
  reason: string
) {
  return fetchJson<ProductActionResponse>(
    `/api/admin/products/${productId}/hide`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  )
}

/** POST /api/admin/products/:id/unhide */
export function unhideProduct(token: string, productId: string) {
  return fetchJson<ProductActionResponse>(
    `/api/admin/products/${productId}/unhide`,
    token,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

/** POST /api/admin/products/:id/remove */
export function removeProduct(
  token: string,
  productId: string,
  reason: string
) {
  return fetchJson<ProductActionResponse>(
    `/api/admin/products/${productId}/remove`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  )
}
