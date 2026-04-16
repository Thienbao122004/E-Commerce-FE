import { api } from "@/lib/api-client"
import type { ShopListResponse, ShopResponse } from "@/types/seller"

// ---------- List ----------
export function fetchSellers(
  page = 1,
  pageSize = 10,
  verificationStatus?: number | null
): Promise<ShopListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (verificationStatus !== null && verificationStatus !== undefined)
    params.set("verificationStatus", String(verificationStatus))
  return api.get<ShopListResponse>(`/api/admin/sellers?${params}`)
}

// ---------- Detail ----------
export function fetchSellerById(shopId: string): Promise<ShopResponse> {
  return api.get<ShopResponse>(`/api/admin/sellers/${shopId}`)
}

// ---------- Approve ----------
export function approveSeller(shopId: string, note?: string): Promise<ShopResponse> {
  return api.post<ShopResponse>(`/api/admin/sellers/${shopId}/approve`, { note })
}

// ---------- Reject ----------
export function rejectSeller(shopId: string, reason: string): Promise<ShopResponse> {
  return api.post<ShopResponse>(`/api/admin/sellers/${shopId}/reject`, { reason })
}

// ---------- Activate ----------
export function activateSeller(shopId: string): Promise<ShopResponse> {
  return api.post<ShopResponse>(`/api/admin/sellers/${shopId}/activate`)
}

// ---------- Suspend ----------
export function suspendSeller(shopId: string, reason: string): Promise<ShopResponse> {
  return api.post<ShopResponse>(`/api/admin/sellers/${shopId}/suspend`, { reason })
}

// ---------- Close ----------
export function closeSeller(shopId: string, reason: string): Promise<ShopResponse> {
  return api.post<ShopResponse>(`/api/admin/sellers/${shopId}/close`, { reason })
}
