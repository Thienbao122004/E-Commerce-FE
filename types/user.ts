export const UserStatus = {
  Suspended: 0,
  Active: 1,
} as const

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus]

export const UserStatusLabels: Record<number, string> = {
  [UserStatus.Suspended]: "Bị khóa",
  [UserStatus.Active]: "Đang hoạt động",
}

export const UserStatusColors: Record<number, string> = {
  [UserStatus.Active]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [UserStatus.Suspended]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export type AdminUser = {
  id: string
  userCode: string
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
