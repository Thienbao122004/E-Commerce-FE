import type {
  DisputeListResponse,
  DisputeResponse,
} from "@/lib/types/dispute"

const API = process.env.NEXT_PUBLIC_API_URL

// ---------- List ----------
export async function fetchDisputes(
  token: string,
  page = 1,
  pageSize = 20,
  status?: number | null,
  type?: number | null
): Promise<DisputeListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== null && status !== undefined) params.set("status", String(status))
  if (type !== null && type !== undefined) params.set("type", String(type))

  const res = await fetch(`${API}/api/admin/disputes?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách tranh chấp")
  return res.json()
}

// ---------- Detail ----------
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

// ---------- Approve Refund ----------
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

// ---------- Reject ----------
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
