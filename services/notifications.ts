import { api } from '@/lib/api-client'

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

export const notificationsService = {
  getNotifications: (page = 1, pageSize = 10, isRead?: boolean) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (isRead !== undefined) params.set('isRead', String(isRead))
    return api.get<NotificationListResponse>(`/api/notifications?${params.toString()}`)
  },

  markAsRead: (notificationId: string) =>
    api.put<NotificationActionResult>(`/api/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.put<NotificationActionResult>('/api/notifications/read-all'),
}
