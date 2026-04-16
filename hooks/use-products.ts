"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  fetchProducts,
  hideProduct as apiHide,
  unhideProduct as apiUnhide,
  removeProduct as apiRemove,
} from "@/services/products"
import type { ProductModeration } from "@/types/product"

type Params = {
  page: number
  pageSize: number
  status: number | null
  search: string
}

export function useProducts(initialParams?: Partial<Params>) {
  const [products, setProducts] = useState<ProductModeration[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [params, setParams] = useState<Params>({
    page: 1,
    pageSize: 10,
    status: null,
    search: "",
    ...initialParams,
  })

  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: params.search || null,
      })
      if (!mountedRef.current) return
      if (res.success) {
        setProducts(res.products)
        setTotalCount(res.totalCount)
      } else if (res.message) {
        toast.error(res.message)
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [params])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const hideProduct = useCallback(async (productId: string, reason: string) => {
    setActionLoading(true)
    try {
      const res = await apiHide(productId, reason)
      if (res.success) {
        toast.success(res.message ?? "Ẩn sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi khi ẩn sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi ẩn sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const unhideProduct = useCallback(async (productId: string) => {
    setActionLoading(true)
    try {
      const res = await apiUnhide(productId)
      if (res.success) {
        toast.success(res.message ?? "Hiển thị lại sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi khi hiển thị lại sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi hiển thị lại sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const removeProduct = useCallback(async (productId: string, reason: string) => {
    setActionLoading(true)
    try {
      const res = await apiRemove(productId, reason)
      if (res.success) {
        toast.success(res.message ?? "Gỡ sản phẩm thành công")
        await load()
        return true
      } else {
        toast.error(res.message ?? "Lỗi khi gỡ sản phẩm")
        return false
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi gỡ sản phẩm")
      return false
    } finally {
      setActionLoading(false)
    }
  }, [load])

  const setPage = useCallback((page: number) => {
    setParams(p => ({ ...p, page }))
  }, [])

  const setStatus = useCallback((status: number | null) => {
    setParams(p => ({ ...p, status, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams(p => ({ ...p, search, page: 1 }))
  }, [])

  const totalPages = Math.ceil(totalCount / params.pageSize)

  return {
    products,
    totalCount,
    loading,
    actionLoading,
    params,
    totalPages,
    setPage,
    setStatus,
    setSearch,
    hideProduct,
    unhideProduct,
    removeProduct,
    reload: load,
  }
}
