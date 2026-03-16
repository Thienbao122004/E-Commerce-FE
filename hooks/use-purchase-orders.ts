'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ordersService, type OrderSummary } from '@/services/orders'

type StatusFilter = number | undefined

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
      if (mountedRef.current) {
        setOrders(nextOrders)
      }
    } catch {
      if (mountedRef.current) {
        setOrders([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadOrders(activeStatus)

    return () => {
      mountedRef.current = false
    }
  }, [activeStatus, loadOrders])

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
