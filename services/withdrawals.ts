import type { WithdrawListResponse, WithdrawResponse } from "@/types/withdraw"

const API = process.env.NEXT_PUBLIC_API_URL

// ---------- List ----------
export async function fetchWithdrawals(
  token: string,
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<WithdrawListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== null && status !== undefined)
    params.set("status", String(status))

  const res = await fetch(`${API}/api/admin/withdrawals?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách yêu cầu rút tiền")
  return res.json()
}

// ---------- Approve ----------
export async function approveWithdrawal(
  token: string,
  requestId: string,
  adminNote?: string
): Promise<WithdrawResponse> {
  const res = await fetch(`${API}/api/admin/withdrawals/${requestId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi duyệt yêu cầu rút tiền")
  return res.json()
}

// ---------- Reject ----------
export async function rejectWithdrawal(
  token: string,
  requestId: string,
  reason: string,
  adminNote?: string
): Promise<WithdrawResponse> {
  const res = await fetch(`${API}/api/admin/withdrawals/${requestId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason, adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi từ chối yêu cầu rút tiền")
  return res.json()
}
