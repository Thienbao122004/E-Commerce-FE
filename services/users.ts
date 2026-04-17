import { api } from "@/lib/api-client"
import type {
  UserListResponse,
  UserResponse,
  AuditLogResponse,
  UserAddressesResponse,
  UserWalletDetailResponse,
  UserProductReviewsResponse,
  UserShopReviewsResponse,
  SimpleMessageResponse,
} from "@/types/user"

export function fetchUsers(
  page = 1,
  pageSize = 10,
  role?: string | null,
  status?: number | null
): Promise<UserListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (role) params.set("role", role)
  if (status !== null && status !== undefined) params.set("status", String(status))
  return api.get<UserListResponse>(`/api/admin/users?${params}`)
}

export function fetchUserById(id: string): Promise<UserResponse> {
  return api.get<UserResponse>(`/api/admin/users/${id}`)
}

export function updateUser(
  id: string,
  data: { fullName?: string; phone?: string; role?: string }
): Promise<UserResponse> {
  return api.put<UserResponse>(`/api/admin/users/${id}`, data)
}

export function suspendUser(id: string, reason: string): Promise<UserResponse> {
  return api.post<UserResponse>(`/api/admin/users/${id}/suspend`, { reason })
}

export function unsuspendUser(id: string): Promise<UserResponse> {
  return api.post<UserResponse>(`/api/admin/users/${id}/unsuspend`)
}

// ---------- Audit Logs ----------
export function fetchUserAuditLogs(userId: string): Promise<AuditLogResponse> {
  return api.get<AuditLogResponse>(`/api/admin/users/${userId}/audit-logs`)
}

export function fetchUserAddresses(userId: string): Promise<UserAddressesResponse> {
  return api.get<UserAddressesResponse>(`/api/admin/users/${userId}/addresses`)
}

export function fetchUserWalletDetails(userId: string): Promise<UserWalletDetailResponse> {
  return api.get<UserWalletDetailResponse>(`/api/admin/users/${userId}/wallet`)
}

export function fetchUserProductReviews(
  userId: string,
  page = 1,
  pageSize = 10
): Promise<UserProductReviewsResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return api.get<UserProductReviewsResponse>(`/api/admin/users/${userId}/reviews/products?${params}`)
}

export function fetchUserShopReviews(
  userId: string,
  page = 1,
  pageSize = 10
): Promise<UserShopReviewsResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return api.get<UserShopReviewsResponse>(`/api/admin/users/${userId}/reviews/shops?${params}`)
}

export function updateUserAccountStatus(
  userId: string,
  body: { status: number; reason?: string | null }
): Promise<UserResponse> {
  return api.put<UserResponse>(`/api/admin/users/${userId}/account-status`, body)
}

export function sendUserPasswordReset(userId: string): Promise<SimpleMessageResponse> {
  return api.post<SimpleMessageResponse>(`/api/admin/users/${userId}/send-password-reset`)
}
