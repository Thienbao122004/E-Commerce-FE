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

const API = process.env.NEXT_PUBLIC_API_URL

export async function fetchUsers(
  token: string,
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

  const res = await fetch(`${API}/api/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải danh sách người dùng")
  return res.json()
}

export async function fetchUserById(
  token: string,
  id: string
): Promise<UserResponse> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải thông tin người dùng")
  return res.json()
}

export async function updateUser(
  token: string,
  id: string,
  data: { fullName?: string; phone?: string; role?: string }
): Promise<UserResponse> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Lỗi cập nhật người dùng")
  return res.json()
}

export async function suspendUser(
  token: string,
  id: string,
  reason: string
): Promise<UserResponse> {
  const res = await fetch(`${API}/api/admin/users/${id}/suspend`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error("Lỗi khóa tài khoản")
  return res.json()
}

export async function unsuspendUser(
  token: string,
  id: string
): Promise<UserResponse> {
  const res = await fetch(`${API}/api/admin/users/${id}/unsuspend`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi mở khóa tài khoản")
  return res.json()
}

// ---------- Audit Logs ----------
export async function fetchUserAuditLogs(
  token: string,
  userId: string
): Promise<AuditLogResponse> {
  const res = await fetch(`${API}/api/admin/users/${userId}/audit-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải lịch sử thay đổi")
  return res.json()
}

export async function fetchUserAddresses(
  token: string,
  userId: string
): Promise<UserAddressesResponse> {
  const res = await fetch(`${API}/api/admin/users/${userId}/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải địa chỉ")
  return res.json()
}

export async function fetchUserWalletDetails(
  token: string,
  userId: string
): Promise<UserWalletDetailResponse> {
  const res = await fetch(`${API}/api/admin/users/${userId}/wallet`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi tải ví")
  return res.json()
}

export async function fetchUserProductReviews(
  token: string,
  userId: string,
  page = 1,
  pageSize = 10
): Promise<UserProductReviewsResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await fetch(
    `${API}/api/admin/users/${userId}/reviews/products?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("Lỗi tải đánh giá sản phẩm")
  return res.json()
}

export async function fetchUserShopReviews(
  token: string,
  userId: string,
  page = 1,
  pageSize = 10
): Promise<UserShopReviewsResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await fetch(
    `${API}/api/admin/users/${userId}/reviews/shops?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error("Lỗi tải đánh giá shop")
  return res.json()
}

export async function updateUserAccountStatus(
  token: string,
  userId: string,
  body: { status: number; reason?: string | null }
): Promise<UserResponse> {
  const res = await fetch(`${API}/api/admin/users/${userId}/account-status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Lỗi cập nhật trạng thái")
  return res.json()
}

export async function sendUserPasswordReset(
  token: string,
  userId: string
): Promise<SimpleMessageResponse> {
  const res = await fetch(`${API}/api/admin/users/${userId}/send-password-reset`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Lỗi gửi email đặt lại mật khẩu")
  return res.json()
}
