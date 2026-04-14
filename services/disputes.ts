import type {
  DisputeListResponse,
  DisputeResponse,
  SellerDisputeListResponse,
  SellerDisputeResponse,
  CustomerDisputeListResponse,
  CustomerDisputeResponse,
  CreateDisputeRequest,
} from "@/types/dispute"

const API = process.env.NEXT_PUBLIC_API_URL

export async function fetchDisputes(
  token: string,
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

  const res = await fetch(`${API}/api/admin/disputes?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách tranh chấp")
  return res.json()
}

export async function fetchDisputeById(
  token: string,
  id: string
): Promise<DisputeResponse> {
  const res = await fetch(`${API}/api/admin/disputes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải chi tiết tranh chấp")
  return res.json()
}

export async function approveRefund(
  token: string,
  disputeId: string,
  approvedAmount?: number,
  resolution?: string,
  adminNote?: string
): Promise<DisputeResponse> {
  const res = await fetch(
    `${API}/api/admin/disputes/${disputeId}/approve-refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ approvedAmount, resolution, adminNote }),
    }
  )
  if (!res.ok) throw new Error("Lỗi duyệt hoàn tiền")
  return res.json()
}

export async function rejectDispute(
  token: string,
  disputeId: string,
  resolution: string,
  adminNote?: string
): Promise<DisputeResponse> {
  const res = await fetch(
    `${API}/api/admin/disputes/${disputeId}/reject`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resolution, adminNote }),
    }
  )
  if (!res.ok) throw new Error("Lỗi từ chối tranh chấp")
  return res.json()
}

export async function requestSellerResponse(
  token: string,
  disputeId: string,
  adminNote?: string
): Promise<DisputeResponse> {
  const res = await fetch(`${API}/api/admin/disputes/${disputeId}/request-seller-response`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi yêu cầu seller phản hồi")
  return res.json()
}

export async function requestCustomerResponse(
  token: string,
  disputeId: string,
  adminNote?: string
): Promise<DisputeResponse> {
  const res = await fetch(`${API}/api/admin/disputes/${disputeId}/request-customer-response`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ adminNote }),
  })
  if (!res.ok) throw new Error("Lỗi yêu cầu customer bổ sung")
  return res.json()
}

export async function fetchSellerDisputes(
  token: string,
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

  const res = await fetch(`${API}/api/seller/disputes?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách tranh chấp")
  return res.json()
}

export async function fetchSellerDisputeById(
  token: string,
  disputeId: string
): Promise<SellerDisputeResponse> {
  const res = await fetch(`${API}/api/seller/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải chi tiết tranh chấp")
  return res.json()
}

export async function respondToSellerDispute(
  token: string,
  disputeId: string,
  response: string,
  evidenceUrls?: string[]
): Promise<SellerDisputeResponse> {
  const res = await fetch(`${API}/api/seller/disputes/${disputeId}/respond`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ response, evidenceUrls }),
  })
  if (!res.ok) throw new Error("Lỗi gửi phản hồi")
  return res.json()
}

// ---------- Customer Dispute APIs ----------

export async function fetchMyDisputes(
  token: string,
  page = 1,
  pageSize = 10,
  status?: number | null
): Promise<CustomerDisputeListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status !== null && status !== undefined) params.set("status", String(status))
  const res = await fetch(`${API}/api/disputes?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách khiếu nại")
  return res.json()
}

export async function fetchMyDisputeById(
  token: string,
  disputeId: string
): Promise<CustomerDisputeResponse> {
  const res = await fetch(`${API}/api/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải chi tiết khiếu nại")
  return res.json()
}

export async function createDispute(
  token: string,
  data: CreateDisputeRequest
): Promise<CustomerDisputeResponse> {
  const res = await fetch(`${API}/api/disputes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({ success: false, message: "Lỗi không xác định" }))
  if (!res.ok) throw new Error(json?.message ?? "Lỗi tạo khiếu nại")
  return json
}

export async function updateDisputeEvidence(
  token: string,
  disputeId: string,
  evidenceUrls: string[],
  customerNote?: string
): Promise<CustomerDisputeResponse> {
  const res = await fetch(`${API}/api/disputes/${disputeId}/evidence`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ evidenceUrls, customerNote }),
  })
  if (!res.ok) throw new Error("Lỗi cập nhật bằng chứng")
  return res.json()
}

export async function cancelMyDispute(
  token: string,
  disputeId: string
): Promise<CustomerDisputeResponse> {
  const res = await fetch(`${API}/api/disputes/${disputeId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi hủy khiếu nại")
  return res.json()
}
