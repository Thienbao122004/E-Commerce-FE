import { api } from "@/lib/api-client"
import type {
  DisputeListResponse,
  DisputeResponse,
  SellerDisputeListResponse,
  SellerDisputeResponse,
  CustomerDisputeListResponse,
  CustomerDisputeResponse,
  CreateDisputeRequest,
} from "@/types/dispute"

export function fetchDisputes(
  page = 1,
  pageSize = 20,
  status?: number | null,
  type?: number | null,
  customerId?: string | null
): Promise<DisputeListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== null && status !== undefined) params.set("status", String(status))
  if (type !== null && type !== undefined) params.set("type", String(type))
  if (customerId) params.set("customerId", customerId)
  return api.get<DisputeListResponse>(`/api/admin/disputes?${params}`)
}

export function fetchDisputeById(id: string): Promise<DisputeResponse> {
  return api.get<DisputeResponse>(`/api/admin/disputes/${id}`)
}

export function approveRefund(
  disputeId: string,
  approvedAmount?: number,
  resolution?: string,
  adminNote?: string
): Promise<DisputeResponse> {
  return api.post<DisputeResponse>(
    `/api/admin/disputes/${disputeId}/approve-refund`,
    { approvedAmount, resolution, adminNote }
  )
}

export function rejectDispute(
  disputeId: string,
  resolution: string,
  adminNote?: string
): Promise<DisputeResponse> {
  return api.post<DisputeResponse>(
    `/api/admin/disputes/${disputeId}/reject`,
    { resolution, adminNote }
  )
}

export function requestSellerResponse(
  disputeId: string,
  adminNote?: string
): Promise<DisputeResponse> {
  return api.post<DisputeResponse>(
    `/api/admin/disputes/${disputeId}/request-seller-response`,
    { adminNote }
  )
}

export function requestCustomerResponse(
  disputeId: string,
  adminNote?: string
): Promise<DisputeResponse> {
  return api.post<DisputeResponse>(
    `/api/admin/disputes/${disputeId}/request-customer-response`,
    { adminNote }
  )
}

export function fetchSellerDisputes(
  page = 1,
  pageSize = 20,
  status?: number | null,
  type?: number | null
): Promise<SellerDisputeListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== null && status !== undefined) params.set("status", String(status))
  if (type !== null && type !== undefined) params.set("type", String(type))
  return api.get<SellerDisputeListResponse>(`/api/seller/disputes?${params}`)
}

export function fetchSellerDisputeById(disputeId: string): Promise<SellerDisputeResponse> {
  return api.get<SellerDisputeResponse>(`/api/seller/disputes/${disputeId}`)
}

export function respondToSellerDispute(
  disputeId: string,
  response: string,
  evidenceUrls?: string[]
): Promise<SellerDisputeResponse> {
  return api.post<SellerDisputeResponse>(
    `/api/seller/disputes/${disputeId}/respond`,
    { response, evidenceUrls }
  )
}

// ---------- Customer Dispute APIs ----------

export function fetchMyDisputes(
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<CustomerDisputeListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status !== null && status !== undefined) params.set("status", String(status))
  return api.get<CustomerDisputeListResponse>(`/api/disputes?${params}`)
}

export function fetchMyDisputeById(disputeId: string): Promise<CustomerDisputeResponse> {
  return api.get<CustomerDisputeResponse>(`/api/disputes/${disputeId}`)
}

export function createDispute(data: CreateDisputeRequest): Promise<CustomerDisputeResponse> {
  return api.post<CustomerDisputeResponse>("/api/disputes", data)
}

export function updateDisputeEvidence(
  disputeId: string,
  evidenceUrls: string[],
  customerNote?: string
): Promise<CustomerDisputeResponse> {
  return api.put<CustomerDisputeResponse>(
    `/api/disputes/${disputeId}/evidence`,
    { evidenceUrls, customerNote }
  )
}

export function cancelMyDispute(disputeId: string): Promise<CustomerDisputeResponse> {
  return api.post<CustomerDisputeResponse>(`/api/disputes/${disputeId}/cancel`)
}
