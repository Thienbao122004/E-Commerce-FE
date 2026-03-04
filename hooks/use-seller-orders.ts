"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  fetchMyOrders,
  updateMyOrderStatus,
} from "@/services/seller-dashboard"
import type {
  SellerOrder,
  UpdateSellerOrderStatusPayload,
} from "@/types/seller-dashboard"

type Params = {
  page: number
  pageSize: number
  status: number | undefined
  search: string
}

export function useSellerOrders(initialParams?: Partial<Params>) {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [params, setParams] = useState<Params>({
    page: 1,
    pageSize: 20,
    status: undefined,
    search: "",
    ...initialParams,
  })

  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyOrders(params.page, params.pageSize, params.status)
      if (!mountedRef.current) return
      if (res.success && res.data) {
        let filtered = res.data
        if (params.search) {
          const q = params.search.toLowerCase()
          filtered = filtered.filter(
            (o) =>
              o.id.toLowerCase().includes(q) ||
              o.customerName?.toLowerCase().includes(q) ||
              o.customerPhone?.toLowerCase().includes(q)
          )
        }
        setOrders(filtered)
        setTotalCount(filtered.length)
      } else {
        setOrders([])
        setTotalCount(0)
      }
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : "Lỗi tải đơn hàng"
        if (!msg.includes("No access token")) toast.error(msg)
        setOrders([])
        setTotalCount(0)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [params])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  const updateStatus = useCallback(
    async (orderId: string, dto: UpdateSellerOrderStatusPayload) => {
      setActionLoading(true)
      try {
        const res = await updateMyOrderStatus(orderId, dto)
        if (res.success) {
          toast.success(res.message ?? "Cập nhật trạng thái thành công")
          await load()
          return true
        } else {
          toast.error(res.message ?? "Lỗi cập nhật trạng thái")
          return false
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Lỗi cập nhật trạng thái")
        return false
      } finally {
        setActionLoading(false)
      }
    },
    [load]
  )

  const setPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams((p) => ({ ...p, pageSize, page: 1 }))
  }, [])

  const setStatus = useCallback((status: number | undefined) => {
    setParams((p) => ({ ...p, status, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search, page: 1 }))
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize))

  return {
    orders,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setPageSize,
    setStatus,
    setSearch,
    updateStatus,
    reload: load,
  }
}
