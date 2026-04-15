'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ordersService, type OrderSummary } from '@/services/orders'

type StatusFilter = number | undefined

const POLL_INTERVAL_MS = 15_000 // poll mỗi 15s

// Các tab chỉ có đơn kết thúc — không cần poll
const STATIC_STATUS_TABS = new Set([7, 8]) // Đã hủy, Đã hoàn tiền

function getStatusKey(status: StatusFilter): string {
  return status === undefined ? 'all' : String(status)
}

export function usePurchaseOrders(initialStatus: StatusFilter = undefined) {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(initialStatus)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  const cacheRef = useRef<Map<string, OrderSummary[]>>(new Map())
  const mountedRef = useRef(true)

  const loadOrders = useCallback(async (status: StatusFilter, force = false) => {
    const cacheKey = getStatusKey(status)

    if (!force && cacheRef.current.has(cacheKey)) {
      setOrders(cacheRef.current.get(cacheKey) ?? [])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await ordersService.getMyOrders(1, 50, status)
      const nextOrders = Array.isArray(res.orders) ? res.orders : []
      cacheRef.current.set(cacheKey, nextOrders)
      if (mountedRef.current) setOrders(nextOrders)
    } catch {
      if (mountedRef.current) setOrders([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  // Silent poll — bypass cache, không hiện loading spinner
  const silentPoll = useCallback(async (status: StatusFilter) => {
    try {
      const res = await ordersService.getMyOrders(1, 50, status)
      const nextOrders = Array.isArray(res.orders) ? res.orders : []
      if (!mountedRef.current) return
      // Chỉ cập nhật khi có thay đổi thực sự (so sánh trạng thái từng đơn)
      const cached = cacheRef.current.get(getStatusKey(status))
      const hasChange =
        !cached ||
        cached.length !== nextOrders.length ||
        nextOrders.some((o, i) => cached[i]?.status !== o.status || cached[i]?.id !== o.id)
      if (hasChange) {
        cacheRef.current.set(getStatusKey(status), nextOrders)
        setOrders(nextOrders)
      }
    } catch {
      // bỏ qua lỗi khi poll ngầm
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadOrders(activeStatus)
    return () => { mountedRef.current = false }
  }, [activeStatus, loadOrders])

  // Auto-poll ngầm cho các tab có đơn đang hoạt động
  useEffect(() => {
    if (typeof activeStatus === 'number' && STATIC_STATUS_TABS.has(activeStatus)) return
    const timer = setInterval(() => void silentPoll(activeStatus), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [activeStatus, silentPoll])

  const refreshCurrent = useCallback(async () => {
    await loadOrders(activeStatus, true)
  }, [activeStatus, loadOrders])

  const invalidateAndRefresh = useCallback(async () => {
    cacheRef.current.clear()
    await loadOrders(activeStatus, true)
  }, [activeStatus, loadOrders])

  return {
    activeStatus,
    setActiveStatus,
    orders,
    loading,
    refreshCurrent,
    invalidateAndRefresh,
  }
}
