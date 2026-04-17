export interface NotificationItem {
  id: string
  type: string
  title: string
  content: string
  referenceType?: string | null
  referenceId?: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationListResponse {
  success: boolean
  message?: string
  notifications: NotificationItem[]
  totalCount: number
  unreadCount: number
  page: number
  pageSize: number
}

export interface NotificationActionResult {
  success: boolean
  message: string
  updatedCount: number
}
