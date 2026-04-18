import { api } from "@/lib/api-client"
import type {
  DisputeListResponse,
  DisputeResponse,
  SellerDispute,
  SellerDisputeListResponse,
  SellerDisputeResponse,
  CustomerDispute,
  CustomerDisputeListResponse,
  CustomerDisputeResponse,
  CreateDisputeRequest,
} from "@/types/dispute"

/** Gộp adminNote (camelCase) hoặc AdminNote (PascalCase) từ JSON. */
function normalizeCustomerDispute(
  d: CustomerDispute & Record<string, unknown>
): CustomerDispute {
  const raw = d.adminNote ?? d.AdminNote
  let adminNote: string | null = null
  if (typeof raw === "string") {
    const t = raw.trim()
    if (t.length > 0) adminNote = t
  }
  return { ...d, adminNote }
}

function normalizeCustomerDisputeResponse(
  res: CustomerDisputeResponse
): CustomerDisputeResponse {
  if (!res.dispute) return res
  return {
    ...res,
    dispute: normalizeCustomerDispute(
      res.dispute as CustomerDispute & Record<string, unknown>
    ),
  }
}

function normalizeCustomerDisputeListResponse(
  res: CustomerDisputeListResponse
): CustomerDisputeListResponse {
  return {
    ...res,
    disputes: res.disputes.map((x) =>
      normalizeCustomerDispute(x as CustomerDispute & Record<string, unknown>)
    ),
  }
}

function normalizeSellerDispute(
  d: SellerDispute & Record<string, unknown>
): SellerDispute {
  const raw = d.adminNote ?? d.AdminNote
  let adminNote: string | null = null
  if (typeof raw === "string") {
    const t = raw.trim()
    if (t.length > 0) adminNote = t
  }
  return { ...d, adminNote }
}

function normalizeSellerDisputeResponse(res: SellerDisputeResponse): SellerDisputeResponse {
  if (!res.dispute) return res
  return {
    ...res,
    dispute: normalizeSellerDispute(
      res.dispute as SellerDispute & Record<string, unknown>
    ),
  }
}

function normalizeSellerDisputeListResponse(
  res: SellerDisputeListResponse
): SellerDisputeListResponse {
  return {
    ...res,
    disputes: res.disputes.map((x) =>
      normalizeSellerDispute(x as SellerDispute & Record<string, unknown>)
    ),
  }
}

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

export async function fetchSellerDisputes(
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
  const res = await api.get<SellerDisputeListResponse>(`/api/seller/disputes?${params}`)
  return normalizeSellerDisputeListResponse(res)
}

export async function fetchSellerDisputeById(disputeId: string): Promise<SellerDisputeResponse> {
  const res = await api.get<SellerDisputeResponse>(`/api/seller/disputes/${disputeId}`)
  return normalizeSellerDisputeResponse(res)
}

export async function respondToSellerDispute(
  disputeId: string,
  response: string,
  evidenceUrls?: string[]
): Promise<SellerDisputeResponse> {
  const res = await api.post<SellerDisputeResponse>(
    `/api/seller/disputes/${disputeId}/respond`,
    { response, evidenceUrls }
  )
  return normalizeSellerDisputeResponse(res)
}

// ---------- Customer Dispute APIs ----------

export async function fetchMyDisputes(
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<CustomerDisputeListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status !== null && status !== undefined) params.set("status", String(status))
  const res = await api.get<CustomerDisputeListResponse>(`/api/disputes?${params}`)
  return normalizeCustomerDisputeListResponse(res)
}

export async function fetchMyDisputeById(disputeId: string): Promise<CustomerDisputeResponse> {
  const res = await api.get<CustomerDisputeResponse>(`/api/disputes/${disputeId}`)
  return normalizeCustomerDisputeResponse(res)
}

export async function createDispute(data: CreateDisputeRequest): Promise<CustomerDisputeResponse> {
  const res = await api.post<CustomerDisputeResponse>("/api/disputes", data)
  return normalizeCustomerDisputeResponse(res)
}

export async function updateDisputeEvidence(
  disputeId: string,
  evidenceUrls: string[],
  customerNote?: string
): Promise<CustomerDisputeResponse> {
  const res = await api.put<CustomerDisputeResponse>(
    `/api/disputes/${disputeId}/evidence`,
    { evidenceUrls, customerNote }
  )
  return normalizeCustomerDisputeResponse(res)
}

export async function cancelMyDispute(disputeId: string): Promise<CustomerDisputeResponse> {
  const res = await api.post<CustomerDisputeResponse>(`/api/disputes/${disputeId}/cancel`)
  return normalizeCustomerDisputeResponse(res)
}
