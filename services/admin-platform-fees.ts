import { api } from "@/lib/api-client"
import type {
  PlatformFeeRecordsApiResponse,
  PlatformFeeSummaryApiResponse,
  PlatformFeeSettingsApiResponse,
  PlatformFeeSettingsHistoryApiResponse,
  UpdatePlatformFeeSettingsRequest,
} from "@/types/admin-platform-fees"

export function fetchPlatformFeeSummary(
  fromUtc?: string,
  toUtc?: string
): Promise<PlatformFeeSummaryApiResponse> {
  const q = new URLSearchParams()
  if (fromUtc) q.set("fromUtc", fromUtc)
  if (toUtc) q.set("toUtc", toUtc)
  const qs = q.toString()
  return api.get<PlatformFeeSummaryApiResponse>(
    `/api/admin/platform-fees/summary${qs ? `?${qs}` : ""}`
  )
}

export function fetchPlatformFeeRecords(
  page: number,
  pageSize: number,
  fromUtc?: string,
  toUtc?: string,
  shopId?: string
): Promise<PlatformFeeRecordsApiResponse> {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (fromUtc) q.set("fromUtc", fromUtc)
  if (toUtc) q.set("toUtc", toUtc)
  if (shopId) q.set("shopId", shopId)
  return api.get<PlatformFeeRecordsApiResponse>(`/api/admin/platform-fees/records?${q}`)
}

export function fetchPlatformFeeSettings(): Promise<PlatformFeeSettingsApiResponse> {
  return api.get<PlatformFeeSettingsApiResponse>("/api/admin/platform-fees/settings")
}

export function updatePlatformFeeSettings(
  request: UpdatePlatformFeeSettingsRequest
): Promise<PlatformFeeSettingsApiResponse> {
  return api.put<PlatformFeeSettingsApiResponse>("/api/admin/platform-fees/settings", request)
}

export function fetchPlatformFeeSettingsHistory(
  page: number,
  pageSize: number
): Promise<PlatformFeeSettingsHistoryApiResponse> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return api.get<PlatformFeeSettingsHistoryApiResponse>(`/api/admin/platform-fees/settings/history?${q}`)
}
