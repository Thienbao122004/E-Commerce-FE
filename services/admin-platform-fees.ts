import type {
  PlatformFeeRecordsApiResponse,
  PlatformFeeSummaryApiResponse,
  PlatformFeeSettingsApiResponse,
  PlatformFeeSettingsHistoryApiResponse,
  UpdatePlatformFeeSettingsRequest,
} from "@/types/admin-platform-fees"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

async function fetchJson<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    ...options,
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      const text = await res.text().catch(() => "")
      if (text) message = text
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export function fetchPlatformFeeSummary(
  token: string,
  fromUtc?: string,
  toUtc?: string
) {
  const q = new URLSearchParams()
  if (fromUtc) q.set("fromUtc", fromUtc)
  if (toUtc) q.set("toUtc", toUtc)
  const qs = q.toString()
  return fetchJson<PlatformFeeSummaryApiResponse>(
    `/api/admin/platform-fees/summary${qs ? `?${qs}` : ""}`,
    token
  )
}

export function fetchPlatformFeeRecords(
  token: string,
  page: number,
  pageSize: number,
  fromUtc?: string,
  toUtc?: string,
  shopId?: string
) {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (fromUtc) q.set("fromUtc", fromUtc)
  if (toUtc) q.set("toUtc", toUtc)
  if (shopId) q.set("shopId", shopId)
  return fetchJson<PlatformFeeRecordsApiResponse>(
    `/api/admin/platform-fees/records?${q}`,
    token
  )
}

export function fetchPlatformFeeSettings(token: string) {
  return fetchJson<PlatformFeeSettingsApiResponse>(
    "/api/admin/platform-fees/settings",
    token
  )
}

export function updatePlatformFeeSettings(
  token: string,
  request: UpdatePlatformFeeSettingsRequest
) {
  return fetchJson<PlatformFeeSettingsApiResponse>(
    "/api/admin/platform-fees/settings",
    token,
    { method: "PUT", body: JSON.stringify(request) }
  )
}

export function fetchPlatformFeeSettingsHistory(
  token: string,
  page: number,
  pageSize: number
) {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return fetchJson<PlatformFeeSettingsHistoryApiResponse>(
    `/api/admin/platform-fees/settings/history?${q}`,
    token
  )
}
