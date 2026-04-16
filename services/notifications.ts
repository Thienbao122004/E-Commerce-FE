import { api } from '@/lib/api-client'
import type {
  NotificationListResponse,
  NotificationActionResult,
} from '@/types/notification'

export type { NotificationItem, NotificationListResponse, NotificationActionResult } from '@/types/notification'

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
