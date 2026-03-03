// ---------- User Status ----------
export const UserStatus = {
  Inactive: 0,
  Active: 1,
  Suspended: 2,
  Deleted: 3,
} as const

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus]

export const UserStatusLabels: Record<number, string> = {
  [UserStatus.Inactive]: "Chưa kích hoạt",
  [UserStatus.Active]: "Đang hoạt động",
  [UserStatus.Suspended]: "Bị khóa",
  [UserStatus.Deleted]: "Đã xóa",
}

export const UserStatusColors: Record<number, string> = {
  [UserStatus.Inactive]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  [UserStatus.Active]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [UserStatus.Suspended]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [UserStatus.Deleted]:
    "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

// ---------- Types ----------
export type AdminUser = {
  id: string
  email: string | null
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
