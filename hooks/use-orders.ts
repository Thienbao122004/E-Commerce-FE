"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  fetchOrders,
  updateOrderStatus as apiUpdateStatus,
} from "@/services/orders"
import { supabase } from "@/lib/supabase"
import type { AdminOrder } from "@/types/order"

type Params = {
  page: number
  pageSize: number
  status: number | null
  search: string
}

export function useOrders(initialParams?: Partial<Params>) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [params, setParams] = useState<Params>({
    page: 1,
    pageSize: 20,
    status: null,
    search: "",
    ...initialParams,
  })

  const mountedRef = useRef(true)

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session?.access_token) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
      return null
    }
    return data.session.access_token
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const token = await getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchOrders(token, {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: params.search || null,
      })
      if (!mountedRef.current) return
      if (res.success) {
        setOrders(res.orders)
        setTotalCount(res.totalCount)
      } else if (res.message) {
        toast.error(res.message)
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Lỗi tải đơn hàng")
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [getToken, params])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const updateStatus = useCallback(
    async (orderId: string, newStatus: number, reason?: string) => {
      setActionLoading(true)
      const token = await getToken()
      if (!token) { setActionLoading(false); return false }
      try {
        const res = await apiUpdateStatus(token, orderId, newStatus, reason)
        if (res.success) {
          toast.success(res.message ?? "Cập nhật trạng thái thành công")
          await load()
          return true
        } else {
          toast.error(res.message ?? "Lỗi cập nhật trạng thái")
          return false
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Lỗi cập nhật")
        return false
      } finally {
        setActionLoading(false)
      }
    },
    [getToken, load]
  )

  const setPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }))
  }, [])

  const setStatus = useCallback((status: number | null) => {
    setParams((p) => ({ ...p, status, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search, page: 1 }))
  }, [])

  const totalPages = Math.ceil(totalCount / params.pageSize)

  return {
    orders,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setStatus,
    setSearch,
    updateStatus,
    reload: load,
  }
}
