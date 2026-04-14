/** Khớp backend: Inactive=0, Active=1, Suspended=2 */
export const UserStatus = {
  Inactive: 0,
  Active: 1,
  Suspended: 2,
} as const

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus]

export const UserStatusLabels: Record<number, string> = {
  [UserStatus.Inactive]: "Vô hiệu hóa",
  [UserStatus.Active]: "Đang hoạt động",
  [UserStatus.Suspended]: "Bị khóa",
}

export const UserStatusColors: Record<number, string> = {
  [UserStatus.Active]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [UserStatus.Inactive]:
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300",
  [UserStatus.Suspended]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

/** Legacy: status 0 + có lý do khóa = hiển thị như Suspended */
export function userStatusBadgeClass(u: {
  status: number
  suspensionReason?: string | null
}): string {
  if (u.status === UserStatus.Inactive && u.suspensionReason)
    return UserStatusColors[UserStatus.Suspended] ?? ""
  return UserStatusColors[u.status] ?? "bg-muted"
}

export function userStatusLabel(u: {
  status: number
  statusName: string
  suspensionReason?: string | null
}): string {
  if (u.status === UserStatus.Inactive && u.suspensionReason)
    return UserStatusLabels[UserStatus.Suspended]
  return UserStatusLabels[u.status] ?? u.statusName
}

/** Dữ liệu từ Supabase Auth (API admin) — khớp backend SupabaseAuthInfoDto */
export type SupabaseAuthInfo = {
  lastSignInAt: string | null
  authUserCreatedAt: string | null
  emailConfirmedAt: string | null
  authPhone: string | null
  authDisplayName: string | null
  providers: string[]
}

export type AdminUser = {
  id: string
  userCode: string
  email: string | null
  avatarUrl?: string | null
  fullName: string | null
  phone: string | null
  role: string
  status: number
  statusName: string
  hasOrders: boolean
  suspensionReason: string | null
  suspendedAt: string | null
  suspendedBy: string | null
  createdAt: string
  updatedAt: string
  supabase?: SupabaseAuthInfo | null
}

export type UserAuditLog = {
  id: string
  userId: string
  editorId: string
  editorName: string | null
  action: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

export type UserListResponse = {
  success: boolean
  message?: string | null
  users: AdminUser[]
  totalCount: number
  page: number
  pageSize: number
}

export type UserResponse = {
  success: boolean
  message?: string | null
  user?: AdminUser
}

export type AuditLogResponse = {
  success: boolean
  message?: string | null
  logs: UserAuditLog[]
}

export type UserAddress = {
  id: string
  label: string | null
  fullName: string | null
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  ward: string | null
  district: string | null
  city: string
  province: string | null
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
}

export type UserAddressesResponse = {
  success: boolean
  message?: string | null
  addresses: UserAddress[]
}

export type WalletLedgerEntry = {
  id: string
  type: string
  amount: number
  currency: string
  referenceType: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
}

export type UserWalletDetailResponse = {
  success: boolean
  message?: string | null
  customer?: {
    walletId: string | null
    availableBalance: number
    currency: string
    ledger: WalletLedgerEntry[]
  } | null
  seller?: {
    walletId: string | null
    availableBalance: number
    heldBalance: number
    pendingBalance: number
    currency: string
    ledger: WalletLedgerEntry[]
  } | null
}

export type UserProductReviewItem = {
  id: string
  productId: string
  productName: string
  rating: number
  title: string | null
  content: string | null
  status: number
  createdAt: string
}

export type UserProductReviewsResponse = {
  success: boolean
  message?: string | null
  reviews: UserProductReviewItem[]
  totalCount: number
  page: number
  pageSize: number
}

export type UserShopReviewItem = {
  id: string
  shopId: string
  shopName: string
  rating: number
  title: string | null
  content: string | null
  status: number
  createdAt: string
}

export type UserShopReviewsResponse = {
  success: boolean
  message?: string | null
  reviews: UserShopReviewItem[]
  totalCount: number
  page: number
  pageSize: number
}

export type SimpleMessageResponse = {
  success: boolean
  message?: string | null
}
