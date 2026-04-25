'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { notificationsService, type NotificationItem } from '@/services/notifications'
import {
  createNotificationsRealtimeConnection,
  disposeNotificationsRealtimeConnection,
  startNotificationsRealtimeConnection,
} from '@/services/notifications-realtime'
import { useAuth } from '@/contexts/auth-context'
import { formatRelativeTimeVN as formatRelativeTime } from '@/lib/formatters'

/** Điều hướng theo ngữ cảnh: khách / seller / admin. */
export function getNotificationUrl(item: NotificationItem, pathname: string): string | null {
  const { referenceType, referenceId } = item
  if (!referenceType || !referenceId) return null
  const type = referenceType.toLowerCase()
  const isSeller = pathname.startsWith('/seller')
  const isAdmin = pathname.startsWith('/admin')

  if (type === 'order' || type === 'payment') {
    if (isSeller) return `/seller/orders/${referenceId}`
    if (isAdmin) return '/admin/dashboard'
    return `/user/purchase/${referenceId}`
  }
  if (type === 'dispute') {
    if (isSeller) return `/seller/disputes/${referenceId}`
    if (isAdmin) return `/admin/dashboard/disputes/${referenceId}`
    return `/user/disputes/${referenceId}`
  }
  if (type === 'shop') return '/seller/profile'
  if (type === 'chat_message') {
    if (isSeller) return `/seller/chat?conversation=${referenceId}`
    return null
  }
  if (type === 'withdrawal') {
    if (isSeller) return '/seller/wallet'
    return '/user/profile/wallet'
  }
  if (type === 'product') {
    if (isSeller) return `/seller/products/${referenceId}`
    if (isAdmin) return '/admin/dashboard/products'
    return null
  }
  return null
}

const ANIM_DURATION = 150
const STALE_MS = 30_000

export function NotificationDropdown() {
  const { session } = useAuth()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedAtRef = useRef<number>(0)

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!session) return

    if (!silent) setLoading(true)
    try {
      const res = await notificationsService.getNotifications(1, 10)
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
      lastFetchedAtRef.current = Date.now()
    } catch {
      toast.error('Không tải được thông báo')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime: server gửi NotificationsUpdated qua SignalR khi có thông báo mới
  useEffect(() => {
    const token = session?.access_token
    if (!token) return

    const connection = createNotificationsRealtimeConnection(token, () => {
      void fetchNotifications(true)
    })
    void startNotificationsRealtimeConnection(connection)

    return () => {
      void disposeNotificationsRealtimeConnection(connection)
    }
  }, [session?.access_token, fetchNotifications])

  // Dự phòng: poll chậm nếu mất kết nối hub
  useEffect(() => {
    if (!session) return
    const timer = setInterval(() => fetchNotifications(true), 60_000)
    return () => clearInterval(timer)
  }, [session, fetchNotifications])

  const clearAnimTimer = () => {
    if (!animTimerRef.current) return
    clearTimeout(animTimerRef.current)
    animTimerRef.current = null
  }

  const handleMouseEnter = () => {
    clearAnimTimer()
    setClosing(false)
    if (open) return
    setOpen(true)
    if (session && Date.now() - lastFetchedAtRef.current > STALE_MS) {
      fetchNotifications(true)
    }
  }

  const handleMouseLeave = () => {
    clearAnimTimer()
    setClosing(true)
    animTimerRef.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, ANIM_DURATION)
  }

  useEffect(() => {
    return () => clearAnimTimer()
  }, [])

  const handleNotificationClick = async (item: NotificationItem) => {
    // Đánh dấu đã đọc (optimistic)
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      notificationsService.markAsRead(item.id).catch(() => fetchNotifications())
    }

    // Điều hướng nếu có URL liên quan
    const url = getNotificationUrl(item, pathname)
    if (url) {
      setOpen(false)
      setClosing(false)
      router.push(url)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!unreadCount) return

    const prevNotifications = notifications
    const prevUnreadCount = unreadCount

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await notificationsService.markAllAsRead()
    } catch {
      setNotifications(prevNotifications)
      setUnreadCount(prevUnreadCount)
      toast.error('Không thể đánh dấu tất cả đã đọc')
    }
  }

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications])

  return (
    <>
      <style>{`
        @keyframes notif-enter {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes notif-leave {
          from { opacity: 1; transform: scale(1)    translateY(0); }
          to   { opacity: 0; transform: scale(0.95) translateY(-6px); }
        }
        .notif-enter { animation: notif-enter ${ANIM_DURATION}ms ease forwards; transform-origin: top right; }
        .notif-leave { animation: notif-leave ${ANIM_DURATION}ms ease forwards; transform-origin: top right; }
      `}</style>

      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trigger button — click toggle cho mobile, hover cho desktop */}
        <button
          type="button"
          className="flex items-center justify-center size-10 rounded-full transition-colors hover:bg-[#f0ebe4] relative"
          style={{ color: 'var(--color-text-main)' }}
          title="Thông báo"
          onClick={() => {
            if (open) { setClosing(true); setTimeout(() => { setOpen(false); setClosing(false) }, ANIM_DURATION) }
            else { setOpen(true); setClosing(false); if (session && Date.now() - lastFetchedAtRef.current > STALE_MS) fetchNotifications(true) }
          }}
        >
          <span className="material-symbols-outlined">notifications</span>
          {session && unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className={`absolute right-0 top-full mt-1 w-95 z-50 rounded-md border bg-popover shadow-md outline-none before:absolute before:-top-4 before:right-0 before:w-full before:h-4 before:bg-transparent ${closing ? 'notif-leave' : 'notif-enter'}`}
            style={{ borderColor: '#ece7e1' }}
          >
            {!session ? (
              <>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#ece7e1' }}>
                  <p className="text-base font-medium" style={{ color: 'var(--color-text-main)' }}>
                    Thông Báo
                  </p>
                </div>

                <div className="min-h-10 px-2 py-6 flex flex-col items-center justify-center text-center">
                  <div
                    className="size-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#fde8df' }}
                  >
                    <span className="material-symbols-outlined text-[34px]" style={{ color: '#f08a66' }}>
                      sentiment_satisfied
                    </span>
                  </div>
                  <p className="text-[20px] mt-4" style={{ color: 'var(--color-text-main)' }}>
                    Đăng nhập để xem thông báo
                  </p>
                </div>

                <div className="grid grid-cols-2 border-t" style={{ borderColor: '#ece7e1' }}>
                  <Link
                    href="/register"
                    className="py-3 text-center text-base transition-colors hover:bg-[#f7f4f1]"
                    style={{ color: 'var(--color-text-main)' }}
                  >
                    Đăng ký
                  </Link>
                  <Link
                    href="/login"
                    className="py-3 text-center text-base transition-colors border-l hover:bg-[#f7f4f1]"
                    style={{ color: 'var(--color-text-main)', borderColor: '#ece7e1' }}
                  >
                    Đăng nhập
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: '#e5ded6' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                    Thông báo
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ color: 'var(--color-primary)' }}
                    disabled={unreadCount === 0}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div
                      className="size-5 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : !hasNotifications ? (
                  <div className="py-10 text-center">
                    <span className="material-symbols-outlined text-[40px] text-muted-foreground block">
                      notifications_none
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">Bạn chưa có thông báo nào</p>
                  </div>
                ) : (
                  <div className="max-h-105 overflow-y-auto">
                    {notifications.map((item) => {
                      const url = getNotificationUrl(item, pathname)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className="w-full text-left px-4 py-3 border-b hover:bg-[#faf8f6] transition-colors group"
                          style={{ borderColor: '#f1ece6' }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-1 size-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.isRead ? '#d8d2cb' : 'var(--color-primary)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: 'var(--color-text-main)' }}
                              >
                                {item.title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {item.content}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(item.createdAt)}
                                </p>
                                {url && (
                                  <span
                                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                                    style={{ color: 'var(--color-primary)' }}
                                  >
                                    Xem chi tiết
                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
