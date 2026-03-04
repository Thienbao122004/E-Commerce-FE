import type { ShopListResponse, ShopResponse } from "@/types/seller"

const API = process.env.NEXT_PUBLIC_API_URL

// ---------- List ----------
export async function fetchSellers(
  token: string,
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

  const res = await fetch(`${API}/api/admin/sellers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách người bán")
  return res.json()
}

// ---------- Detail ----------
export async function fetchSellerById(
  token: string,
  shopId: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải thông tin shop")
  return res.json()
}

// ---------- Approve ----------
export async function approveSeller(
  token: string,
  shopId: string,
  note?: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  })
  if (!res.ok) throw new Error("Lỗi duyệt shop")
  return res.json()
}

// ---------- Reject ----------
export async function rejectSeller(
  token: string,
  shopId: string,
  reason: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error("Lỗi từ chối shop")
  return res.json()
}

// ---------- Activate ----------
export async function activateSeller(
  token: string,
  shopId: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi kích hoạt shop")
  return res.json()
}

// ---------- Suspend ----------
export async function suspendSeller(
  token: string,
  shopId: string,
  reason: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}/suspend`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error("Lỗi đình chỉ shop")
  return res.json()
}

// ---------- Close ----------
export async function closeSeller(
  token: string,
  shopId: string,
  reason: string
): Promise<ShopResponse> {
  const res = await fetch(`${API}/api/admin/sellers/${shopId}/close`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error("Lỗi đóng cửa shop")
  return res.json()
}
