import type { CustomerWithdrawalListResponse, CustomerWithdrawalResponse } from "@/types/customer-wallet"

const API = process.env.NEXT_PUBLIC_API_URL

export async function fetchCustomerWithdrawals(
  token: string,
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<CustomerWithdrawalListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status !== null && status !== undefined) params.set("status", String(status))

  const res = await fetch(`${API}/api/admin/customer-withdrawals?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách yêu cầu rút tiền khách hàng")
  return res.json()
}

export async function approveCustomerWithdrawal(
  token: string,
  requestId: string,
  adminNote?: string
): Promise<CustomerWithdrawalResponse> {
  const res = await fetch(`${API}/api/admin/customer-withdrawals/${requestId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi duyệt yêu cầu")
  return res.json()
}

export async function rejectCustomerWithdrawal(
  token: string,
  requestId: string,
  reason: string,
  adminNote?: string
): Promise<CustomerWithdrawalResponse> {
  const res = await fetch(`${API}/api/admin/customer-withdrawals/${requestId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reason, adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi từ chối yêu cầu")
  return res.json()
}
