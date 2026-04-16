import { api } from "@/lib/api-client"
import type { CustomerWithdrawalListResponse, CustomerWithdrawalResponse } from "@/types/customer-wallet"

export function fetchCustomerWithdrawals(
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<CustomerWithdrawalListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status !== null && status !== undefined) params.set("status", String(status))
  return api.get<CustomerWithdrawalListResponse>(`/api/admin/customer-withdrawals?${params}`)
}

export function approveCustomerWithdrawal(
  requestId: string,
  adminNote?: string
): Promise<CustomerWithdrawalResponse> {
  return api.post<CustomerWithdrawalResponse>(
    `/api/admin/customer-withdrawals/${requestId}/approve`,
    { adminNote }
  )
}

export function rejectCustomerWithdrawal(
  requestId: string,
  reason: string,
  adminNote?: string
): Promise<CustomerWithdrawalResponse> {
  return api.post<CustomerWithdrawalResponse>(
    `/api/admin/customer-withdrawals/${requestId}/reject`,
    { reason, adminNote }
  )
}
