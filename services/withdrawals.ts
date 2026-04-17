import { api } from "@/lib/api-client"
import type { WithdrawListResponse, WithdrawResponse } from "@/types/withdraw"

// ---------- List ----------
export function fetchWithdrawals(
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

  return api.get<WithdrawListResponse>(`/api/admin/withdrawals?${params}`)
}

// ---------- Approve ----------
export function approveWithdrawal(
  requestId: string,
  adminNote?: string
): Promise<WithdrawResponse> {
  return api.post<WithdrawResponse>(`/api/admin/withdrawals/${requestId}/approve`, { adminNote })
}

// ---------- Reject ----------
export function rejectWithdrawal(
  requestId: string,
  reason: string,
  adminNote?: string
): Promise<WithdrawResponse> {
  return api.post<WithdrawResponse>(`/api/admin/withdrawals/${requestId}/reject`, { reason, adminNote })
}
